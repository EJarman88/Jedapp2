"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks a lesson completed and, if today's agenda has a matching pending item,
 * checks it off too — so finishing a lesson from its own screen keeps the Home
 * agenda in sync without a separate manual step.
 */
export async function completeLesson(lessonId: string): Promise<void> {
  const user = await requireStudent();
  const supabase = await createClient();

  await supabase.from("lesson_progress").upsert(
    { user_id: user.id, lesson_id: lessonId, status: "completed" },
    { onConflict: "user_id,lesson_id" },
  );

  await supabase
    .from("agenda_items")
    .update({ status: "done" })
    .eq("user_id", user.id)
    .eq("content_slug", lessonId)
    .eq("item_type", "lesson")
    .eq("status", "pending");

  revalidatePath("/home");
}
