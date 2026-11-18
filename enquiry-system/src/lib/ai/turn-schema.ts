import { z } from "zod";

/**
 * The shape of every assistant turn.
 *
 * The model never replies in free text. It fills this structure, enforced by
 * OpenAI Structured Outputs (strict JSON Schema), and the server decides what
 * the visitor actually sees. That is the difference between a chatbot and a
 * controlled workflow with a language model inside it.
 *
 * Two copies of the same contract: a JSON Schema for the API (built per tenant
 * so enquiry_type is an enum of THAT tenant's categories), and a Zod schema to
 * parse what comes back. Strict mode requires every property to be listed in
 * `required` and `additionalProperties: false`; optional values are nullable.
 */

export const INTENTS = [
  "question",
  "booking",
  "quote_request",
  "complaint",
  "emergency",
  "human_request",
  "contact_details",
  "smalltalk",
  "other",
] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export function turnJsonSchema(enquiryTypeKeys: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["reply", "intent", "enquiry_type", "priority", "grounded", "used_refs", "contact", "enquiry_summary", "handover"],
    properties: {
      reply: {
        type: "string",
        description: "The message shown to the visitor. Plain text, at most 3 short sentences.",
      },
      intent: { type: "string", enum: [...INTENTS] },
      enquiry_type: {
        type: "string",
        enum: enquiryTypeKeys,
        description: "Best matching enquiry category for the conversation so far.",
      },
      priority: { type: "string", enum: [...PRIORITIES] },
      grounded: {
        type: "boolean",
        description:
          "True only if every business fact in reply (prices, services, hours, policies, areas) comes from BUSINESS INFORMATION. True for replies with no business facts.",
      },
      used_refs: {
        type: "array",
        items: { type: "string" },
        description: "The [K#] refs of every knowledge entry the reply relied on. Empty if none.",
      },
      contact: {
        type: "object",
        additionalProperties: false,
        required: ["name", "email", "phone"],
        properties: {
          name: { type: ["string", "null"], description: "Exactly as the visitor typed it, or null." },
          email: { type: ["string", "null"], description: "Exactly as the visitor typed it, or null." },
          phone: { type: ["string", "null"], description: "Exactly as the visitor typed it, or null." },
        },
      },
      enquiry_summary: {
        type: ["string", "null"],
        description: "One-line summary of what the visitor needs, for the business. Null if nothing yet.",
      },
      handover: {
        type: "object",
        additionalProperties: false,
        required: ["needed", "reason"],
        properties: {
          needed: { type: "boolean" },
          reason: { type: ["string", "null"] },
        },
      },
    },
  } as const;
}

export const turnSchema = z.object({
  reply: z.string().min(1).max(1200),
  intent: z.enum(INTENTS),
  enquiry_type: z.string(),
  priority: z.enum(PRIORITIES),
  grounded: z.boolean(),
  used_refs: z.array(z.string()).max(20),
  contact: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  enquiry_summary: z.string().max(500).nullable(),
  handover: z.object({ needed: z.boolean(), reason: z.string().max(300).nullable() }),
});

export type ModelTurn = z.infer<typeof turnSchema>;
