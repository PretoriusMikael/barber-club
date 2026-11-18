import { after, type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, json, withErrorHandling } from "@/lib/http";
import { normaliseEmail, normalisePhone } from "@/lib/leads/normalise";
import { dispatchOutbox } from "@/lib/outbox/dispatch";
import { allow, LIMITS } from "@/lib/security/rate-limit";
import { visitorHash } from "@/lib/security/visitor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadTenant } from "@/lib/tenants/load";

/**
 * The plain enquiry form. No AI involved.
 *
 * It exists for three reasons: some visitors don't want to chat; the widget
 * falls back to it when the model is down or the tenant's daily cap is hit;
 * and it lets a client start on the cheapest package (form + notifications +
 * lead inbox) and upgrade to the assistant later.
 */

const bodySchema = z
  .object({
    tenant: z.string().min(3).max(48),
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().max(254).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    enquiryType: z.string().max(32).default("other"),
    message: z.string().trim().min(5).max(2000),
    consent: z.literal(true),
    /** Client-generated per form render; makes double-submits harmless. */
    idempotencyKey: z.string().min(8).max(64),
    website: z.string().max(200).optional(), // honeypot
  })
  .transform((b) => ({ ...b, email: normaliseEmail(b.email), phone: normalisePhone(b.phone) }))
  .refine((b) => b.email || b.phone, { message: "A valid email address or South African phone number is required." });

export const POST = withErrorHandling("enquiry", async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_request", parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const body = parsed.data;
  if (body.website) return json({ ok: true });

  const tenant = await loadTenant(body.tenant);
  if (!tenant) return errorResponse(404, "unknown_tenant", "This form is not available.");

  if (!(await allow(`form:${tenant.id}:${visitorHash(req.headers)}`, LIMITS.formSubmits))) {
    return errorResponse(429, "rate_limited", "Too many submissions. Please try again later or phone us.");
  }

  const enquiryType = tenant.config.enquiryTypes.some((t) => t.key === body.enquiryType) ? body.enquiryType : "other";

  const { error } = await supabaseAdmin().rpc("capture_lead", {
    p_tenant_id: tenant.id,
    p_conversation_id: null,
    p_source: "form",
    p_name: body.name,
    p_email: body.email,
    p_phone: body.phone,
    p_enquiry_type: enquiryType,
    p_priority: "medium",
    p_summary: body.message.slice(0, 140),
    p_message: body.message,
    p_handover: true,
    p_idempotency_key: `${tenant.id}:${body.idempotencyKey}`,
  });
  if (error) throw new Error(`capture_lead: ${error.message}`);

  after(() => dispatchOutbox({ tenantId: tenant.id }).catch((e) => console.error("[outbox]", e)));
  return json({ ok: true });
});
