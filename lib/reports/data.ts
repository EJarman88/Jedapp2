import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GedReadySubject } from "@/lib/supabase/database.types";
import {
  GED_READY_PASSING_SCORE,
  INCENTIVE_PER_SUBJECT,
  SUBJECTS,
  type ConfidenceVsActual,
  type IncentiveProgress,
  type IncentiveStatus,
  type SubjectScoreCard,
  type SubjectStatus,
  type TraitTrends,
} from "./types";

/** The single student account every report is about — regardless of which of the
 * three viewer roles is looking at the dashboard. */
export async function getStudentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id").eq("role", "student").maybeSingle();
  return data?.id ?? null;
}

export async function getSubjectScoreCards(studentUserId: string): Promise<SubjectScoreCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ged_ready_scores")
    .select("subject, score, taken_at")
    .eq("user_id", studentUserId)
    .order("taken_at", { ascending: true });

  return SUBJECTS.map((subject) => {
    const attempts = (data ?? []).filter((r) => r.subject === subject).map((r) => r.score);
    const latestScore = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    let status: SubjectStatus = "not_started";
    if (attempts.some((s) => s >= GED_READY_PASSING_SCORE)) status = "passed";
    else if (attempts.length > 0) status = "in_progress";

    const trendText =
      attempts.length === 0
        ? "No attempts yet"
        : attempts.length === 1
          ? `${attempts[0]} (first attempt)`
          : attempts.join(" → ");

    return { subject, status, latestScore, attempts, attemptCount: attempts.length, trendText };
  });
}

export async function getIncentiveProgress(studentUserId: string): Promise<IncentiveProgress> {
  const supabase = await createClient();
  const [{ data: results }, { data: scores }] = await Promise.all([
    supabase.from("real_test_results").select("subject, passed, paid_out").eq("user_id", studentUserId),
    supabase.from("ged_ready_scores").select("subject").eq("user_id", studentUserId),
  ]);

  const rows = SUBJECTS.map((subject) => {
    const result = (results ?? []).find((r) => r.subject === subject);
    const hasAttempt = (scores ?? []).some((s) => s.subject === subject) || result !== undefined;

    let status: IncentiveStatus = "not_started";
    if (result?.passed) status = "earned";
    else if (hasAttempt) status = "in_progress";

    return { subject, status, paidOut: result?.paid_out ?? false };
  });

  const earnedDollars = rows.filter((r) => r.status === "earned").length * INCENTIVE_PER_SUBJECT;
  return { rows, earnedDollars, totalDollars: SUBJECTS.length * INCENTIVE_PER_SUBJECT };
}

export async function getTraitTrends(studentUserId: string): Promise<TraitTrends> {
  const supabase = await createClient();

  const { data: responses } = await supabase
    .from("extended_responses")
    .select("id, privacy_status")
    .eq("user_id", studentUserId)
    .order("submitted_at", { ascending: true });

  const responseIds = (responses ?? []).map((r) => r.id);
  const traitRows =
    responseIds.length > 0
      ? (
          await supabase
            .from("trait_scores")
            .select("response_id, trait, score")
            .in("response_id", responseIds)
        ).data
      : [];

  const orderIndex = new Map(responseIds.map((id, i) => [id, i]));
  const byTrait = new Map<string, number[]>();
  for (const row of traitRows ?? []) {
    const list = byTrait.get(row.trait) ?? [];
    list.push(row.score);
    byTrait.set(row.trait, list);
  }
  // Sort each trait's scores by response submission order, keep the last 3 for the
  // mini bar trend (matches the reference mockup's 3-bar trait cards).
  const sortedTraitRows = (traitRows ?? [])
    .slice()
    .sort((a, b) => (orderIndex.get(a.response_id) ?? 0) - (orderIndex.get(b.response_id) ?? 0));
  const orderedByTrait = new Map<string, number[]>();
  for (const row of sortedTraitRows) {
    const list = orderedByTrait.get(row.trait) ?? [];
    list.push(row.score);
    orderedByTrait.set(row.trait, list);
  }

  const TRAITS = ["argument_analysis", "organization", "language_command", "grammar_conventions"] as const;

  return {
    traits: TRAITS.map((trait) => ({ trait, scores: (orderedByTrait.get(trait) ?? []).slice(-3) })),
    totalResponses: responses?.length ?? 0,
    sharedCount: (responses ?? []).filter((r) => r.privacy_status === "shared").length,
    privateCount: (responses ?? []).filter((r) => r.privacy_status === "private").length,
  };
}

export async function getConfidenceVsActual(studentUserId: string): Promise<ConfidenceVsActual> {
  const supabase = await createClient();

  const { data: checkins } = await supabase
    .from("confidence_checkins")
    .select("context_id, rating, created_at")
    .eq("user_id", studentUserId)
    .eq("context_type", "practice_session")
    .eq("phase", "pre")
    .order("created_at", { ascending: true })
    .limit(6);

  if (!checkins || checkins.length === 0) return { points: [] };

  const sessionIds = checkins.map((c) => c.context_id);
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("id, score, question_ids")
    .in("id", sessionIds);

  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));

  const points = checkins
    .map((c) => {
      const session = sessionById.get(c.context_id);
      if (!session || session.score === null) return null;
      const total = (session.question_ids as string[]).length || 1;
      return {
        // Confidence is rated 1-4; scaled to 0-100 so it's comparable on the same
        // axis as an actual percentage score, not a literal equivalent unit.
        predicted: Math.round(((c.rating - 1) / 3) * 100),
        actual: Math.round((session.score / total) * 100),
      };
    })
    .filter((p): p is { predicted: number; actual: number } => p !== null);

  return { points };
}

export interface RealTestResultRow {
  subject: GedReadySubject;
  passed: boolean;
  paidOut: boolean;
}

export async function listRealTestResults(studentUserId: string): Promise<RealTestResultRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("real_test_results")
    .select("subject, passed, paid_out")
    .eq("user_id", studentUserId);

  return (data ?? []).map((r) => ({ subject: r.subject, passed: r.passed, paidOut: r.paid_out }));
}
