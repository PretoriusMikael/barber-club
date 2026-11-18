import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Fixed-window limits enforced in Postgres (see hit_rate_limit in the
 * migration). Shared by every serverless instance, so a visitor cannot get
 * around them by landing on a fresh one.
 */
export const LIMITS = {
  /** Chat messages per visitor per tenant. */
  chatBurst: { windowSeconds: 60, max: 8 },
  chatSustained: { windowSeconds: 3600, max: 60 },
  /** New conversations per visitor per tenant. */
  conversationStarts: { windowSeconds: 3600, max: 6 },
  /** Plain form submissions per visitor per tenant. */
  formSubmits: { windowSeconds: 3600, max: 5 },
} as const;

export async function allow(key: string, limit: { windowSeconds: number; max: number }): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    p_key: key,
    p_window_seconds: limit.windowSeconds,
    p_max: limit.max,
  });
  // Fail closed: if we cannot count, we cannot protect the tenant's API budget.
  if (error) throw new Error(`rate limit check failed: ${error.message}`);
  return data === true;
}
