import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GrantStatus, UserRole } from "@/lib/supabase/database.types";

export interface Account {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  createdAt: string;
  grantStatus: GrantStatus | null;
}

/** Admin-only: every account that has ever signed up (at most two — Jalisa + dad). */
export async function listAccounts(): Promise<Account[]> {
  const supabase = await createClient();

  const [{ data: users }, { data: grants }] = await Promise.all([
    supabase.from("users").select("id, role, display_name, email, created_at").order("created_at"),
    supabase.from("access_grants").select("grantee_user_id, status"),
  ]);

  const grantByUser = new Map((grants ?? []).map((g) => [g.grantee_user_id, g.status]));

  return (users ?? []).map((u) => ({
    id: u.id,
    role: u.role,
    displayName: u.display_name,
    email: u.email,
    createdAt: u.created_at,
    grantStatus: grantByUser.get(u.id) ?? null,
  }));
}
