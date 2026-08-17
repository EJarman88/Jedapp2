"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PlanStyle } from "@/lib/supabase/database.types";

export async function updatePlanStyle(planStyle: PlanStyle): Promise<void> {
  const user = await requireStudent();

  const supabase = await createClient();
  await supabase.from("users").update({ plan_style: planStyle }).eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/home");
}
