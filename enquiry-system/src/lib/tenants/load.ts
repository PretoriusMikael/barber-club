import { supabaseAdmin } from "@/lib/supabase/admin";
import { tenantConfigSchema, type KnowledgeEntry, type Tenant } from "./schema";

/**
 * Tenant + knowledge base, cached per server instance for a short TTL.
 *
 * Every chat turn needs the full tenant, and the data changes rarely, so a
 * 60-second cache removes two queries from the hot path. Edits to the
 * knowledge base show up within a minute — acceptable for v1, and the reason
 * there is no cache-invalidation machinery yet.
 */
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; tenant: Tenant | null }>();

export async function loadTenant(slug: string): Promise<Tenant | null> {
  if (!/^[a-z0-9][a-z0-9-]{2,47}$/.test(slug)) return null;

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.tenant;

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("tenants")
    .select("id, slug, name, industry, status, timezone, allowed_origins, daily_message_cap, config")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`loadTenant(${slug}): ${error.message}`);

  let tenant: Tenant | null = null;
  if (row && row.status === "active") {
    const config = tenantConfigSchema.safeParse(row.config);
    if (!config.success) {
      // Fail closed: a half-valid config could drop the handover or pricing rules.
      console.error(`[tenant:${slug}] invalid config`, config.error.issues);
    } else {
      const { data: kb, error: kbError } = await db
        .from("knowledge_entries")
        .select("id, kind, title, body")
        .eq("tenant_id", row.id)
        .eq("is_published", true)
        .order("kind")
        .order("sort_order");
      if (kbError) throw new Error(`loadTenant(${slug}) knowledge: ${kbError.message}`);

      tenant = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        industry: row.industry,
        timezone: row.timezone,
        allowedOrigins: row.allowed_origins ?? [],
        dailyMessageCap: row.daily_message_cap,
        config: config.data,
        knowledge: (kb ?? []) as KnowledgeEntry[],
      };
    }
  }

  cache.set(slug, { at: Date.now(), tenant });
  return tenant;
}
