import type { Question } from "@/content/practice/types";

export interface AnsweredQuestion {
  questionId: string;
  selectedIndex: number | null;
}

export interface MissedQuestionView {
  questionId: string;
  subject: string;
  skillTag: string;
  skillLabel: string;
  questionText: string;
  /** Plain-language "what happened" — authored per-question, not generated live. */
  whatHappened: string;
}

export interface CommonThread {
  skillTag: string;
  skillLabel: string;
  /** True when 2+ misses in this set share this skill tag — a real repeated pattern. */
  isPattern: boolean;
  message: string;
}

export interface DiagnosisResult {
  missed: MissedQuestionView[];
  commonThread: CommonThread | null;
}

const TIMEOUT_NOTE = "ran out of time before answering — worth another look either way";

/**
 * Real diagnostic logic, not a stub: for every missed question, looks up its
 * authored misconception note and skill tag, then tallies misses by skill_tag to
 * find "the common thread" — the specific thing to rebuild first, not everything at
 * once (per the phase doc). If misses are spread across different skills, it doesn't
 * force a false pattern — it surfaces the most recent miss instead.
 */
export function computeDiagnosis(questions: Question[], answers: AnsweredQuestion[]): DiagnosisResult {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const missed: MissedQuestionView[] = [];
  const skillCounts = new Map<string, number>();

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;

    const isCorrect = answer.selectedIndex === question.correctIndex;
    if (isCorrect) continue;

    const whatHappened =
      answer.selectedIndex === null
        ? TIMEOUT_NOTE
        : (question.misconceptionNotes[answer.selectedIndex] ?? "picked a different option than the one that best fits");

    missed.push({
      questionId: question.id,
      subject: question.subject,
      skillTag: question.skillTag,
      skillLabel: question.skillLabel,
      questionText: question.question,
      whatHappened,
    });

    skillCounts.set(question.skillTag, (skillCounts.get(question.skillTag) ?? 0) + 1);
  }

  if (missed.length === 0) {
    return { missed, commonThread: null };
  }

  let topSkillTag = missed[missed.length - 1].skillTag;
  let topCount = 0;
  for (const [skillTag, count] of skillCounts) {
    if (count > topCount) {
      topCount = count;
      topSkillTag = skillTag;
    }
  }

  const topSkillLabel = missed.find((m) => m.skillTag === topSkillTag)!.skillLabel;
  const isPattern = topCount >= 2;

  const commonThread: CommonThread = {
    skillTag: topSkillTag,
    skillLabel: topSkillLabel,
    isPattern,
    message: isPattern
      ? `Across these misses, the repeated thread is: ${topSkillLabel.toLowerCase()}. That's the specific thing to rebuild first — not everything at once.`
      : `The clearest gap right now is: ${topSkillLabel.toLowerCase()}.`,
  };

  return { missed, commonThread };
}
