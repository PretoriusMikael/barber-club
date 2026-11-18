import { z } from "zod";

/**
 * Everything that makes one client's assistant different from another's.
 *
 * Stored as tenants.config (jsonb) so onboarding a client is a data change,
 * not a deploy. Parsed on every load: a malformed config fails that tenant
 * closed instead of producing an assistant with half its rules missing.
 */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h HH:MM");
const dayHours = z.array(z.tuple([hhmm, hhmm])).default([]);

export const tenantConfigSchema = z.object({
  assistant: z.object({
    name: z.string().min(1).max(40),
    greeting: z.string().min(1).max(400),
    tone: z.string().max(300).default("Warm, concise, plain South African English."),
  }),
  theme: z
    .object({ accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#111827") })
    .default({ accent: "#111827" }),
  contact: z.object({
    phone: z.string().max(40).optional(),
    email: z.email().optional(),
    /** Digits only, international format without "+", for wa.me links. */
    whatsapp: z.string().regex(/^[1-9]\d{7,14}$/).optional(),
    address: z.string().max(300).optional(),
  }),
  hours: z.object({
    mon: dayHours,
    tue: dayHours,
    wed: dayHours,
    thu: dayHours,
    fri: dayHours,
    sat: dayHours,
    sun: dayHours,
  }),
  enquiryTypes: z
    .array(
      z.object({
        key: z.string().regex(/^[a-z][a-z0-9_]{1,31}$/),
        label: z.string().min(1).max(60),
        description: z.string().max(400),
      }),
    )
    .min(1)
    .max(12)
    .refine((types) => types.some((t) => t.key === "other"), 'Include an "other" enquiry type'),
  priorityRules: z.array(z.string().max(300)).max(10).default([]),
  handover: z.object({
    triggers: z.array(z.string().max(300)).max(10).default([]),
    message: z.string().min(1).max(400),
  }),
  booking: z.object({
    url: z.url().nullable().default(null),
    label: z.string().max(40).default("Book now"),
  }),
  notifications: z.object({
    email: z.array(z.email()).min(1),
    urgentEmail: z.array(z.email()).default([]),
  }),
  privacy: z.object({
    noticeUrl: z.url(),
    retentionDays: z.number().int().min(30).max(730).default(180),
  }),
  fallbackMessage: z.string().min(1).max(400),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type Weekday = keyof TenantConfig["hours"];

export interface KnowledgeEntry {
  id: string;
  kind: "about" | "service" | "faq" | "policy" | "location";
  title: string;
  body: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  timezone: string;
  allowedOrigins: string[];
  dailyMessageCap: number;
  config: TenantConfig;
  knowledge: KnowledgeEntry[];
}

/** The subset of a tenant that is safe to send to the browser. */
export interface PublicTenant {
  slug: string;
  name: string;
  assistantName: string;
  greeting: string;
  accent: string;
  privacyNoticeUrl: string;
  contact: { phone?: string; email?: string; whatsapp?: string };
  enquiryTypes: { key: string; label: string }[];
}

export function toPublicTenant(t: Tenant): PublicTenant {
  return {
    slug: t.slug,
    name: t.name,
    assistantName: t.config.assistant.name,
    greeting: t.config.assistant.greeting,
    accent: t.config.theme.accent,
    privacyNoticeUrl: t.config.privacy.noticeUrl,
    contact: {
      phone: t.config.contact.phone,
      email: t.config.contact.email,
      whatsapp: t.config.contact.whatsapp,
    },
    enquiryTypes: t.config.enquiryTypes.map(({ key, label }) => ({ key, label })),
  };
}
