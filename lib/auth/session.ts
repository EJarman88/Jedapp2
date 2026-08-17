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

/**
 * Same gate as requireStudent(), plus the admin — used only by the student-facing
 * screens (Home/Lessons tabs, agenda + lesson-progress writes) so the admin can
 * permanently preview the real student experience under her own account. Every write
 * these screens make is scoped to the caller's own user_id (enforced by RLS), so an
 * admin's preview agenda/lesson progress is a completely separate row set from the
 * student's real ones — previewing never touches her actual data.
 */
export async function requireStudentOrAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
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

export type ReportsViewerRole = "student" | "admin" | "restricted_reports";

export interface ReportsAccess {
  user: SessionUser;
  viewerRole: ReportsViewerRole;
  /** Whether this viewer is currently allowed to see report data — access is
   * re-checked on every call, never cached, so a revoke takes effect immediately,
   * even mid-session. */
  allowed: boolean;
}

/**
 * The one gate for the shared Reports dashboard (Phase 8), covering all three
 * possible viewers: the student (always allowed, it's her own data), the admin
 * (gated by the student's own parent_access_enabled toggle — CLAUDE.md rule #5, a
 * separate mechanism from access_grants), and a restricted_reports account (gated by
 * its own active access_grants row, per Phase 2). Redirects away entirely for anyone
 * who isn't one of those three roles; returns `allowed: false` rather than
 * redirecting when the role is right but access isn't currently granted, so the page
 * can render a plain "not currently available" state instead of a broken one.
 */
export async function requireReportsAccess(): Promise<ReportsAccess> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    return { user, viewerRole: "student", allowed: true };
  }

  const supabase = await createClient();

  if (user.role === "admin") {
    const { data: student } = await supabase
      .from("users")
      .select("parent_access_enabled")
      .eq("role", "student")
      .maybeSingle();
    return { user, viewerRole: "admin", allowed: student?.parent_access_enabled ?? false };
  }

  const { data: grant } = await supabase
    .from("access_grants")
    .select("status")
    .eq("grantee_user_id", user.id)
    .eq("scope", "reports")
    .maybeSingle();

  return { user, viewerRole: "restricted_reports", allowed: (grant?.status ?? "inert") === "active" };
}
