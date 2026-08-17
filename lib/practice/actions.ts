"use server";

import { revalidatePath } from "next/cache";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { drawPracticeSet, getQuestionsByIds } from "@/content/practice";
import type { Question } from "@/content/practice/types";
import { getRemediationLessonBySkillTag } from "@/content/remediation";
import type { RemediationLesson } from "@/content/remediation/types";
import { computeDiagnosis, type AnsweredQuestion, type DiagnosisResult } from "@/lib/practice/diagnosis";
import type { ConfidenceContextType, ConfidencePhase } from "@/lib/supabase/database.types";
import { logEngagementEvent } from "@/lib/engagement/log";

const QUESTIONS_PER_SET = 5;
const SECONDS_PER_QUESTION = 60;
// A set finished in under this share of the student's own recent median duration for
// this task type gets a soft "fast_completion" flag — metadata only, see CLAUDE.md
// rule #4. Needs at least MIN_PRIOR_SESSIONS completed sets to establish a baseline.
const FAST_COMPLETION_THRESHOLD = 0.2;
const MIN_PRIOR_SESSIONS_FOR_BASELINE = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface StartPracticeSetResult {
  sessionId: string;
  questions: Question[];
  timeLimitSeconds: number;
}

/** Draws a fresh set and opens a practice_sessions row for it. */
export async function startPracticeSet(): Promise<StartPracticeSetResult> {
  const user = await requireStudentOrAdmin();
  const supabase = await createClient();

  const questions = drawPracticeSet(QUESTIONS_PER_SET);
  const timeLimitSeconds = questions.length * SECONDS_PER_QUESTION;

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      question_ids: questions.map((q) => q.id),
      time_limit_seconds: timeLimitSeconds,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not start a practice set.");

  await logEngagementEvent(supabase, user.id, "session_started", {
    contextType: "practice_session",
    contextId: data.id,
  });

  return { sessionId: data.id, questions, timeLimitSeconds };
}

export interface SubmitPracticeSetResult extends DiagnosisResult {
  score: number;
  total: number;
}

/**
 * Scores a completed set, records every answer, syncs today's agenda, and — for a
 * score below the "worth a closer look" threshold — runs the diagnostic engine.
 */
export async function submitPracticeSet(
  sessionId: string,
  answers: AnsweredQuestion[],
): Promise<SubmitPracticeSetResult> {
  const user = await requireStudentOrAdmin();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, question_ids, started_at")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    throw new Error("That practice set couldn't be found.");
  }

  const questions = getQuestionsByIds(session.question_ids);
  const byId = new Map(questions.map((q) => [q.id, q]));

  const score = answers.filter((a) => {
    const q = byId.get(a.questionId);
    return q && a.selectedIndex === q.correctIndex;
  }).length;

  await supabase.from("practice_answers").insert(
    answers.map((a) => {
      const q = byId.get(a.questionId);
      return {
        session_id: sessionId,
        question_id: a.questionId,
        selected_index: a.selectedIndex,
        is_correct: q !== undefined && a.selectedIndex === q.correctIndex,
        time_spent_seconds: 0,
      };
    }),
  );

  const completedAt = new Date();
  await supabase
    .from("practice_sessions")
    .update({ score, completed_at: completedAt.toISOString() })
    .eq("id", sessionId);

  await supabase
    .from("agenda_items")
    .update({ status: "done" })
    .eq("user_id", user.id)
    .eq("item_type", "practice")
    .eq("status", "pending");

  await logEngagementEvent(supabase, user.id, "session_completed", {
    contextType: "practice_session",
    contextId: sessionId,
  });

  const durationSeconds = (completedAt.getTime() - new Date(session.started_at).getTime()) / 1000;
  const { data: priorSessions } = await supabase
    .from("practice_sessions")
    .select("started_at, completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .neq("id", sessionId)
    .order("completed_at", { ascending: false })
    .limit(5);

  const priorDurations = (priorSessions ?? []).map(
    (s) => (new Date(s.completed_at!).getTime() - new Date(s.started_at).getTime()) / 1000,
  );
  if (priorDurations.length >= MIN_PRIOR_SESSIONS_FOR_BASELINE) {
    const medianSeconds = median(priorDurations);
    if (durationSeconds < medianSeconds * FAST_COMPLETION_THRESHOLD) {
      await logEngagementEvent(supabase, user.id, "fast_completion", {
        contextType: "practice_session",
        contextId: sessionId,
        metadata: { durationSeconds: Math.round(durationSeconds), medianSeconds: Math.round(medianSeconds) },
      });
    }
  }

  if (answers.length >= 3 && answers.every((a) => a.selectedIndex === answers[0].selectedIndex)) {
    await logEngagementEvent(supabase, user.id, "answer_pattern_flag", {
      contextType: "practice_session",
      contextId: sessionId,
      metadata: { pattern: "straight_lining" },
    });
  }

  revalidatePath("/home");

  const diagnosis = computeDiagnosis(questions, answers);
  return { ...diagnosis, score, total: questions.length };
}

export async function recordConfidenceCheckin(
  contextType: ConfidenceContextType,
  contextId: string,
  rating: number,
  phase: ConfidencePhase,
): Promise<void> {
  const user = await requireStudentOrAdmin();
  const supabase = await createClient();

  await supabase.from("confidence_checkins").insert({
    user_id: user.id,
    context_type: contextType,
    context_id: contextId,
    rating,
    phase,
  });
}

export async function fetchRemediationLesson(skillTag: string): Promise<RemediationLesson | null> {
  await requireStudentOrAdmin();
  return getRemediationLessonBySkillTag(skillTag) ?? null;
}
