import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GrantStatus, UserRole } from "@/lib/supabase/database.types";

export interface SessionUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  displayName: string;
}

/** Returns the signed-in user's profile, or null if no one is logged in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email,
    role: profile.role,
    displayName: profile.display_name,
  };
}

/** Redirects away unless the signed-in user is Jalisa (admin). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/reports");
  return user;
}

/**
 * Redirects away unless the signed-in user is dad (restricted_reports). Grant status
 * is re-read from the database on every call — never cached on the session — so a
 * revoke takes effect on the very next request, including mid-session.
 */
export async function requireRestrictedReports(): Promise<{
  user: SessionUser;
  grantStatus: GrantStatus;
}> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "restricted_reports") redirect("/home");

  const supabase = await createClient();
  const { data: grant } = await supabase
    .from("access_grants")
    .select("status")
    .eq("grantee_user_id", user.id)
    .eq("scope", "reports")
    .maybeSingle();

  return { user, grantStatus: grant?.status ?? "inert" };
}
