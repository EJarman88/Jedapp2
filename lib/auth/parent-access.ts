"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * A student toggles whether her parent/admin can see her reports. The real
 * enforcement (18+ only, can't touch any other field) is the
 * users_enforce_parent_access_toggle trigger in the DB — this is just the request
 * shape, not the authorization.
 */
export async function setParentAccess(enabled: boolean): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "student") {
    return { error: "Only a student account can change this." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ parent_access_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}
