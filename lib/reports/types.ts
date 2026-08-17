import type { GedReadySubject, Trait } from "@/lib/supabase/database.types";

export const SUBJECTS: GedReadySubject[] = ["RLA", "Math", "Science", "Social Studies"];
export const GED_READY_PASSING_SCORE = 145;
export const FUNDED_ATTEMPTS_PER_SUBJECT = 2;
export const INCENTIVE_PER_SUBJECT = 75;

export type SubjectStatus = "passed" | "in_progress" | "not_started";

export interface SubjectScoreCard {
  subject: GedReadySubject;
  status: SubjectStatus;
  latestScore: number | null;
  attempts: number[];
  attemptCount: number;
  trendText: string;
}

export type IncentiveStatus = "earned" | "in_progress" | "not_started";

export interface IncentiveRow {
  subject: GedReadySubject;
  status: IncentiveStatus;
  paidOut: boolean;
}

export interface IncentiveProgress {
  rows: IncentiveRow[];
  earnedDollars: number;
  totalDollars: number;
}

export interface TraitTrend {
  trait: Trait;
  scores: number[];
}

export interface TraitTrends {
  traits: TraitTrend[];
  totalResponses: number;
  sharedCount: number;
  privateCount: number;
}

export interface ConfidencePoint {
  predicted: number;
  actual: number;
}

export interface ConfidenceVsActual {
  points: ConfidencePoint[];
}
