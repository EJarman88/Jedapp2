import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GedReadyScoreView } from "@/lib/practice/ged-ready-types";

export { GED_READY_PASSING_SCORE, type GedReadyScoreView } from "@/lib/practice/ged-ready-types";

/** Every manually-entered GED Ready score for a user, most recent first. */
export async function listGedReadyScores(userId: string): Promise<GedReadyScoreView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ged_ready_scores")
    .select("id, subject, score, attempt_number, taken_at")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    score: row.score,
    attemptNumber: row.attempt_number,
    takenAt: row.taken_at,
  }));
}
