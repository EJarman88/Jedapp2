"use server";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ThemeId } from "./themes";

export async function saveThemePreference(theme: ThemeId): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("users").update({ theme_preference: theme }).eq("id", user.id);
}
