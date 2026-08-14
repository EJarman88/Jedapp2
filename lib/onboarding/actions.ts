"use server";

import { requireStudent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PlanStyle } from "@/lib/supabase/database.types";
import type { ThemeId } from "@/lib/theme/themes";

export async function completeOnboarding(theme: ThemeId, planStyle: PlanStyle): Promise<void> {
  const user = await requireStudent();

  const supabase = await createClient();
  await supabase
    .from("users")
    .update({ theme_preference: theme, plan_style: planStyle })
    .eq("id", user.id);
}
