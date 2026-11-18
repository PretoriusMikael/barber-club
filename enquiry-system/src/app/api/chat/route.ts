import { after, type NextRequest } from "next/server";
import { z } from "zod";
import { buildContextNote, buildInstructions, buildRefMap } from "@/lib/ai/prompt";
import { applyGuardrails } from "@/lib/ai/guardrails";
import { generateTurn, type ModelInputMessage, type ModelResult } from "@/lib/ai/respond";
import { errorResponse, json, withErrorHandling } from "@/lib/http";
import { verifyContact } from "@/lib/leads/normalise";
import { dispatchOutbox } from "@/lib/outbox/dispatch";
import { allow, LIMITS } from "@/lib/security/rate-limit";
import { visitorHash } from "@/lib/security/visitor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { localNow, openStatus } from "@/lib/tenants/hours";
import { loadTenant } from "@/lib/tenants/load";
import type { Tenant } from "@/lib/tenants/schema";

export const maxDuration = 30;

/** Visitor messages per conversation. Caps cost and stops scripted abuse. */
const MAX_USER_TURNS = 20;
/** Messages of history sent to the model. Older turns are summarised in the lead. */
const HISTORY_WINDOW = 16;

const bodySchema = z.object({
  tenant: z.string().min(3).max(48),
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(1000),
  consent: z.boolean().optional(),
  pageUrl: z.string().max(500).optional(),
  /** Honeypot. Hidden from people; bots fill it in. */
  website: z.string().max(200).optional(),
});

export interface ChatResponse {
  conversationId: string;
  reply: string;
  handover: boolean;
  leadCaptured: boolean;
  /** True when the AI is unavailable or capped: the widget offers the plain form. */
  degraded: boolean;
  actions: {
    /** Pages on the client's site, resolved from knowledge entries, never written by the model. */
    links?: { label: string; url: string; sameSite: boolean }[];
    booking?: { url: string; label: string };
    contact?: { phone?: string; email?: string; whatsapp?: string };
  };
}

interface ConversationRow {
  id: string;
  message_count: number;
  lead_id: string | null;
}

export const POST = withErrorHandling("chat", handleChat);

async function handleChat(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return errorResponse(400, "invalid_request", "Invalid request.");
  }

  // Bots get a plausible answer and nothing is stored or spent.
  if (body.website) {
    return json<ChatResponse>({
      conversationId: crypto.randomUUID(),
      reply: "Thanks for your message.",
      handover: false,
      leadCaptured: false,
      degraded: false,
      actions: {},
    });
  }

  const tenant = await loadTenant(body.tenant);
  if (!tenant) return errorResponse(404, "unknown_tenant", "This assistant is not available.");

  const db = supabaseAdmin();
  const visitor = visitorHash(req.headers);
  const limitKey = `${tenant.id}:${visitor}`;

  if (!(await allow(`chat:burst:${limitKey}`, LIMITS.chatBurst)) || !(await allow(`chat:hour:${limitKey}`, LIMITS.chatSustained))) {
    return errorResponse(429, "rate_limited", "You're sending messages quickly. Please wait a minute and try again.");
  }

  // ---- Conversation: resume (verifying tenant ownership) or start ----------
  let conversation: ConversationRow;
  if (body.conversationId) {
    const { data, error } = await db
      .from("conversations")
      .select("id, message_count, lead_id")
      .eq("id", body.conversationId)
      .eq("tenant_id", tenant.id) // a conversation id from another tenant simply does not exist here
      .maybeSingle();
    if (error) throw new Error(`load conversation: ${error.message}`);
    if (!data) return errorResponse(404, "conversation_not_found", "This conversation has expired. Please start a new one.");
    conversation = data;
  } else {
    if (body.consent !== true) return errorResponse(400, "consent_required", "Please accept the privacy notice to start.");
    if (!(await allow(`chat:start:${limitKey}`, LIMITS.conversationStarts))) {
      return errorResponse(429, "rate_limited", "Too many new conversations. Please try again later.");
    }
    const { data, error } = await db
      .from("conversations")
      .insert({ tenant_id: tenant.id, visitor_hash: visitor, page_url: body.pageUrl ?? null, consent_at: new Date().toISOString() })
      .select("id, message_count, lead_id")
      .single();
    if (error) throw new Error(`create conversation: ${error.message}`);
    conversation = data;
  }

  const contactActions = contactActionsFor(tenant);

  // ---- Hard limits: no model call ------------------------------------------
  if (conversation.message_count >= MAX_USER_TURNS * 2) {
    return json<ChatResponse>({
      conversationId: conversation.id,
      reply: `We've reached the limit for this chat. ${tenant.config.handover.message}`,
      handover: true,
      leadCaptured: conversation.lead_id !== null,
      degraded: false,
      actions: { contact: contactActions },
    });
  }

  await insertMessage(conversation.id, tenant.id, "user", body.message);

  const { data: repliesToday, error: capError } = await db.rpc("tenant_replies_today", { p_tenant_id: tenant.id });
  if (capError) throw new Error(`daily cap: ${capError.message}`);
  if ((repliesToday as number) >= tenant.dailyMessageCap) {
    const reply = `${tenant.config.fallbackMessage}`;
    await insertMessage(conversation.id, tenant.id, "assistant", reply, { flags: ["daily_cap"] });
    await bumpConversation(conversation, 2);
    return json<ChatResponse>({
      conversationId: conversation.id,
      reply,
      handover: true,
      leadCaptured: false,
      degraded: true,
      actions: { contact: contactActions },
    });
  }

  // ---- Model call ------------------------------------------------------------
  const { data: history, error: historyError } = await db
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .eq("tenant_id", tenant.id)
    .order("id", { ascending: false })
    .limit(50);
  if (historyError) throw new Error(`load history: ${historyError.message}`);
  const chronological = (history ?? []).reverse() as { role: "user" | "assistant"; content: string }[];
  const visitorText = chronological.filter((m) => m.role === "user").map((m) => m.content).join("\n");

  const refs = buildRefMap(tenant);
  const now = new Date();
  const input: ModelInputMessage[] = [
    {
      role: "developer",
      content: buildContextNote({
        nowLabel: localNow(tenant.timezone, now).label,
        openSummary: tenant.config.hours ? openStatus(tenant.config.hours, tenant.timezone, now).summary : undefined,
        contactCaptured: conversation.lead_id !== null,
        turnsRemaining: MAX_USER_TURNS - Math.floor(conversation.message_count / 2) - 1,
      }),
    },
    ...chronological.slice(-HISTORY_WINDOW).map((m) => ({ role: m.role, content: m.content })),
  ];

  let result: ModelResult | null = null;
  try {
    result = await generateTurn({
      instructions: buildInstructions(tenant, refs),
      input,
      enquiryTypeKeys: tenant.config.enquiryTypes.map((t) => t.key),
      cacheKey: `tenant:${tenant.slug}`,
      safetyId: visitor,
    });
  } catch (err) {
    console.error(`[chat:${tenant.slug}] model call failed`, err);
  }

  // ---- Guardrails --------------------------------------------------------------
  let reply = tenant.config.fallbackMessage;
  let handover = true;
  let degraded = false;
  let leadCaptured = conversation.lead_id !== null;
  let links: NonNullable<ChatResponse["actions"]["links"]> = [];
  let meta: Record<string, unknown>;

  if (result?.turn) {
    const guarded = applyGuardrails({
      turn: result.turn,
      refBodies: new Map([...refs.entries].map(([ref, e]) => [ref, e.body])),
      refUrls: new Map([...refs.entries].flatMap(([ref, e]) => (e.url ? [[ref, e.url] as const] : []))),
      latestUserMessage: body.message,
      enquiryTypeKeys: tenant.config.enquiryTypes.map((t) => t.key),
      fallbackMessage: tenant.config.fallbackMessage,
    });
    reply = guarded.reply;
    handover = guarded.handover;
    links = guarded.linkRefs.map((ref) => {
      const entry = refs.entries.get(ref)!;
      return { label: entry.title, url: entry.url!, sameSite: isSameSite(entry.url!, tenant) };
    });
    meta = {
      intent: result.turn.intent,
      enquiry_type: guarded.enquiryType,
      priority: guarded.priority,
      used_refs: guarded.usedRefs,
      links: guarded.linkRefs,
      handover,
      handover_reason: result.turn.handover.reason,
      flags: guarded.flags,
    };

    // ---- Lead capture: only details the visitor actually typed ----------------
    const contact = verifyContact(result.turn.contact, visitorText);
    if (contact.email || contact.phone) {
      const { error } = await db.rpc("capture_lead", {
        p_tenant_id: tenant.id,
        p_conversation_id: conversation.id,
        p_source: "chat",
        p_name: contact.name,
        p_email: contact.email,
        p_phone: contact.phone,
        p_enquiry_type: guarded.enquiryType,
        p_priority: guarded.priority,
        p_summary: result.turn.enquiry_summary ?? "",
        p_message: null,
        p_handover: handover,
        p_idempotency_key: null,
      });
      if (error) {
        console.error(`[chat:${tenant.slug}] capture_lead failed`, error);
      } else {
        leadCaptured = true;
        after(() => dispatchOutbox({ tenantId: tenant.id }).catch((e) => console.error("[outbox]", e)));
      }
    }
  } else {
    degraded = true;
    meta = { flags: [result?.failure ?? "model_error"] };
  }

  await insertMessage(conversation.id, tenant.id, "assistant", reply, meta, result);
  await bumpConversation(conversation, 2);

  const intent = result?.turn?.intent;
  const booking = tenant.config.booking;
  return json<ChatResponse>({
    conversationId: conversation.id,
    reply,
    handover,
    leadCaptured,
    degraded,
    actions: {
      ...(links.length ? { links } : {}),
      ...(booking.url && (intent === "booking" || intent === "quote_request") ? { booking: { url: booking.url, label: booking.label } } : {}),
      ...(handover ? { contact: contactActions } : {}),
    },
  });
}

/** A link to the client's own site opens in the same tab; anything else in a new one. */
function isSameSite(url: string, tenant: Tenant): boolean {
  try {
    const host = new URL(url).hostname;
    return tenant.allowedOrigins.some((origin) => {
      const allowed = new URL(origin.replace("*.", "")).hostname;
      return host === allowed || host.endsWith(`.${allowed}`);
    });
  } catch {
    return false;
  }
}

function contactActionsFor(tenant: Tenant) {
  const { phone, email, whatsapp } = tenant.config.contact;
  return { phone, email, whatsapp };
}

async function insertMessage(
  conversationId: string,
  tenantId: string,
  role: "user" | "assistant",
  content: string,
  meta: Record<string, unknown> = {},
  result?: ModelResult | null,
) {
  const { error } = await supabaseAdmin()
    .from("messages")
    .insert({
      conversation_id: conversationId,
      tenant_id: tenantId,
      role,
      content,
      meta,
      model: result?.model ?? null,
      input_tokens: result?.usage.input ?? null,
      cached_tokens: result?.usage.cached ?? null,
      output_tokens: result?.usage.output ?? null,
      latency_ms: result?.latencyMs ?? null,
    });
  if (error) throw new Error(`insert message: ${error.message}`);
}

async function bumpConversation(conversation: ConversationRow, by: number) {
  conversation.message_count += by;
  const { error } = await supabaseAdmin()
    .from("conversations")
    .update({ message_count: conversation.message_count, last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);
  if (error) throw new Error(`update conversation: ${error.message}`);
}
