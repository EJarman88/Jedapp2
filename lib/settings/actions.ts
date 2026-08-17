"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** A student toggles whether a restricted_reports account receives her weekly
 * digest — separate from full Reports access (digest_subscriptions, not access_grants). */
export async function setDigestSubscription(granteeUserId: string, enabled: boolean): Promise<{ error?: string }> {
  await requireStudent();

  const supabase = await createClient();
  const { error } = await supabase.from("digest_subscriptions").update({ enabled }).eq("user_id", granteeUserId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return {};
}
