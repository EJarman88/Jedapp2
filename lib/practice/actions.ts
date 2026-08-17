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

const QUESTIONS_PER_SET = 5;
const SECONDS_PER_QUESTION = 60;

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
    .select("id, user_id, question_ids")
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

  await supabase
    .from("practice_sessions")
    .update({ score, completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  await supabase
    .from("agenda_items")
    .update({ status: "done" })
    .eq("user_id", user.id)
    .eq("item_type", "practice")
    .eq("status", "pending");

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
