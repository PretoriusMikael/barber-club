import { z } from "zod";

/**
 * Server environment, validated once on first use.
 *
 * Fails loudly on a missing secret instead of failing quietly on the first
 * request that needs it. Never import this from a client component: none of
 * these values may reach the browser.
 */
const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
  OPENAI_REASONING_EFFORT: z
    .enum(["none", "minimal", "low", "medium", "high"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  N8N_WEBHOOK_URL: z.url().optional().or(z.literal("").transform(() => undefined)),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  VISITOR_HASH_SALT: z.string().min(16),
  CRON_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${missing}. See .env.example.`);
  }
  if (parsed.data.N8N_WEBHOOK_URL && !parsed.data.N8N_WEBHOOK_SECRET) {
    throw new Error("N8N_WEBHOOK_SECRET is required when N8N_WEBHOOK_URL is set.");
  }
  cached = parsed.data;
  return cached;
}
