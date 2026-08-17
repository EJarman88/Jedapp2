"use server";

import { revalidatePath } from "next/cache";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { GedReadySubject } from "@/lib/supabase/database.types";

/**
 * GED Ready is an external, paid tool — this app never calls it. The learner enters
 * her own score here after taking it, per the phase doc.
 */
export async function addGedReadyScore(input: {
  subject: GedReadySubject;
  score: number;
  attemptNumber: number;
  takenAt: string;
}): Promise<{ error?: string }> {
  const user = await requireStudentOrAdmin();

  if (input.score < 100 || input.score > 200) {
    return { error: "GED Ready scores run from 100 to 200." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ged_ready_scores").insert({
    user_id: user.id,
    subject: input.subject,
    score: input.score,
    attempt_number: input.attemptNumber,
    taken_at: input.takenAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/progress");
  return {};
}
