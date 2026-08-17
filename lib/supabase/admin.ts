import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client — bypasses RLS entirely. Only for code paths with no
 * authenticated user to key RLS off of: the public /review/[token] reviewer page
 * (an anonymous visitor holding an unguessable link) and the auto-delete cron job
 * (no request-scoped user at all). Authorization in both cases is enforced in
 * application code, not RLS — never reuse this client for anything a logged-in
 * request could instead do through lib/supabase/server.ts's RLS-scoped client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY isn't set — required for this operation.");
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
