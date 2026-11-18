import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { tenantConfigSchema } from "@/lib/tenants/schema";

/**
 * Delivers outbox events to n8n, at least once.
 *
 * Called (a) right after a request that created events, via next/server
 * after(), and (b) on a schedule via /api/cron/dispatch to retry failures.
 * claim_outbox() leases rows with SKIP LOCKED, so both can run at once.
 *
 * n8n receives everything it needs in the payload — including who to notify —
 * so ONE n8n workflow serves every tenant. Onboarding a client never means
 * cloning a workflow.
 */

interface OutboxRow {
  id: number;
  tenant_id: string;
  event_type: string;
  payload: { lead_id?: string };
  attempts: number;
}

const MAX_ATTEMPTS = 8;

export function sign(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

async function buildLeadEvent(row: OutboxRow) {
  const db = supabaseAdmin();
  const leadId = row.payload.lead_id;
  if (!leadId) throw new Error("lead event without lead_id");

  const { data: lead, error } = await db
    .from("leads")
    .select(
      "id, tenant_id, source, enquiry_type, priority, status, summary, message, handover_requested, created_at, first_conversation_id, contact:contacts(name, email, phone), tenant:tenants(slug, name, config)",
    )
    .eq("id", leadId)
    .eq("tenant_id", row.tenant_id)
    .single();
  if (error || !lead) throw new Error(`lead ${leadId} not found: ${error?.message}`);

  // Supabase types embedded many-to-one relations loosely; normalise.
  const contact = Array.isArray(lead.contact) ? lead.contact[0] : lead.contact;
  const tenant = Array.isArray(lead.tenant) ? lead.tenant[0] : lead.tenant;
  const config = tenantConfigSchema.parse(tenant?.config);

  let transcript: { role: string; content: string; at: string }[] = [];
  if (lead.first_conversation_id) {
    const { data: messages } = await db
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", lead.first_conversation_id)
      .eq("tenant_id", row.tenant_id)
      .order("id", { ascending: true })
      .limit(40);
    transcript = (messages ?? []).map((m) => ({ role: m.role, content: m.content, at: m.created_at }));
  }

  const urgent = lead.priority === "urgent";
  const enquiryLabel = config.enquiryTypes.find((t) => t.key === lead.enquiry_type)?.label ?? lead.enquiry_type;

  return {
    id: row.id,
    type: row.event_type,
    occurred_at: new Date().toISOString(),
    tenant: { slug: tenant?.slug, name: tenant?.name },
    notify: {
      email: urgent && config.notifications.urgentEmail.length ? [...config.notifications.email, ...config.notifications.urgentEmail] : config.notifications.email,
    },
    lead: {
      id: lead.id,
      source: lead.source,
      enquiry_type: lead.enquiry_type,
      enquiry_label: enquiryLabel,
      priority: lead.priority,
      status: lead.status,
      summary: lead.summary,
      message: lead.message,
      handover_requested: lead.handover_requested,
      created_at: lead.created_at,
      contact: { name: contact?.name ?? null, email: contact?.email ?? null, phone: contact?.phone ?? null },
    },
    transcript,
  };
}

async function deliver(row: OutboxRow): Promise<void> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  const event = await buildLeadEvent(row);
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetch(N8N_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Two layers, use either in n8n: Header Auth (built-in, no code) checks
      // this bearer; the HMAC below additionally proves the body was not
      // altered and lets you reject replays by timestamp. See docs/N8N-WORKFLOWS.md.
      Authorization: `Bearer ${N8N_WEBHOOK_SECRET}`,
      "X-Enquiry-Event-Id": String(row.id),
      "X-Enquiry-Timestamp": timestamp,
      "X-Enquiry-Signature": `sha256=${sign(N8N_WEBHOOK_SECRET!, timestamp, body)}`,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`n8n responded ${res.status}`);
}

export async function dispatchOutbox(opts: { tenantId?: string; limit?: number } = {}) {
  if (!env().N8N_WEBHOOK_URL) return { delivered: 0, failed: 0, skipped: "N8N_WEBHOOK_URL not set" };

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("claim_outbox", { p_limit: opts.limit ?? 20, p_tenant_id: opts.tenantId ?? null });
  if (error) throw new Error(`claim_outbox: ${error.message}`);

  let delivered = 0;
  let failed = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    try {
      await deliver(row);
      await db.from("outbox").update({ delivered_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      delivered++;
    } catch (err) {
      failed++;
      // Exponential backoff: 1, 2, 4 ... 64 minutes. After MAX_ATTEMPTS the row
      // stays undelivered and visible for manual follow-up — never silently dropped.
      const delayMinutes = 2 ** Math.min(row.attempts - 1, 6);
      await db
        .from("outbox")
        .update({
          last_error: String(err instanceof Error ? err.message : err).slice(0, 500),
          next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        })
        .eq("id", row.id);
      if (row.attempts >= MAX_ATTEMPTS) console.error(`[outbox] event ${row.id} exhausted retries`, err);
    }
  }
  return { delivered, failed };
}
