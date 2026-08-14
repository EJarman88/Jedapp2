"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthFormState } from "@/lib/auth/form-state";

const PIN_PATTERN = /^\d{6}$/;

/**
 * Admin-only: creates dad's login directly, bypassing the public /signup form
 * entirely. requireAdmin() here IS the real authorization check — the admin client
 * bypasses RLS, so nothing else stands between this and account creation.
 */
export async function inviteRestrictedAccount(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!email || !displayName) {
    return { error: "Fill in a name and email." };
  }
  if (!PIN_PATTERN.test(pin)) {
    return { error: "PIN needs to be exactly 6 digits." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { display_name: displayName, invited_by_admin: true },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}
