import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LessonProgressStatus } from "@/lib/supabase/database.types";

/**
 * Reads (and starts, if this is the first visit) a student's progress on a lesson.
 * Mirrors lib/agenda/data.ts's pattern of doing the "first touch" write inside the
 * read — there's no separate "start lesson" step for the UI to call.
 */
export async function getOrStartLessonProgress(
  userId: string,
  lessonId: string,
): Promise<{ status: LessonProgressStatus }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing) return { status: existing.status };

  await supabase
    .from("lesson_progress")
    .insert({ user_id: userId, lesson_id: lessonId, status: "in_progress" });

  return { status: "in_progress" };
}
