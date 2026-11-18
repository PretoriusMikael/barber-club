import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Rule for every query made with it: scope by a tenant_id the server resolved
 * itself (from the tenant slug), never by an id the browser sent. Conversation
 * ids from the browser are only trusted after checking they belong to that
 * tenant — see loadConversation() in app/api/chat/route.ts.
 */
let client: SupabaseClient | undefined;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
    client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
