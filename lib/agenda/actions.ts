"use server";

import { revalidatePath } from "next/cache";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function toggleAgendaItem(itemId: string, done: boolean): Promise<void> {
  await requireStudentOrAdmin();

  const supabase = await createClient();
  await supabase
    .from("agenda_items")
    .update({ status: done ? "done" : "pending" })
    .eq("id", itemId);

  revalidatePath("/home");
}
