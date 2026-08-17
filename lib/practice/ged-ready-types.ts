import type { GedReadySubject } from "@/lib/supabase/database.types";

export const GED_READY_PASSING_SCORE = 145;

export interface GedReadyScoreView {
  id: string;
  subject: GedReadySubject;
  score: number;
  attemptNumber: number;
  takenAt: string;
}
