"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import type { GrantStatus } from "@/lib/supabase/database.types";

/**
 * Activates or revokes the restricted role's reports access. Enforced for real by the
 * "admin manages own grants" RLS policy — requireAdmin() here is defense in depth, not
 * the source of truth. Never deletes the underlying account, per CLAUDE.md: revoking
 * and re-granting must not require re-registration.
 */
export async function setReportsAccess(granteeUserId: string, active: boolean): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const status: GrantStatus = active ? "active" : "revoked";

  const { error } = await supabase
    .from("access_grants")
    .update({ status })
    .eq("grantee_user_id", granteeUserId)
    .eq("scope", "reports");

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
