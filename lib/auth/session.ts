import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GrantStatus, PlanStyle, UserRole } from "@/lib/supabase/database.types";
import type { ThemeId } from "@/lib/theme/themes";

export interface SessionUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  displayName: string;
  themePreference: ThemeId | null;
  planStyle: PlanStyle | null;
  createdAt: string;
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
    .select("id, role, display_name, theme_preference, plan_style, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email,
    role: profile.role,
    displayName: profile.display_name,
    themePreference: profile.theme_preference,
    planStyle: profile.plan_style,
    createdAt: profile.created_at,
  };
}

/** Redirects away unless the signed-in user has full app access (admin or student). */
export async function requireFullAccess(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "restricted_reports") redirect("/reports");
  return user;
}

/** Redirects away unless the signed-in user is the student — the only role with an
 * agenda/lessons Home Screen. Admin's real landing page is Settings. */
export async function requireStudent(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/settings");
  if (user.role === "restricted_reports") redirect("/reports");
  return user;
}

/** Redirects away unless the signed-in user is the admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(user.role === "student" ? "/home" : "/reports");
  return user;
}

/**
 * Redirects away unless the signed-in user is a reports-only account. Grant status is
 * re-read from the database on every call — never cached on the session — so a revoke
 * takes effect on the very next request, including mid-session.
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
