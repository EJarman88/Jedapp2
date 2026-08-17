import type { Subject } from "@/content/lessons/types";

export type { Subject };

export interface Question {
  /** Stable content id — stored as practice_answers.question_id (text, not a DB FK). */
  id: string;
  subject: Subject;
  /** Groups related questions for the diagnostic engine's pattern detection. */
  skillTag: string;
  /** Plain-language skill name for learner-facing copy (diagnosis cards, common thread). */
  skillLabel: string;
  /** Optional reading/data passage shown above the question. */
  stimulus?: string;
  question: string;
  options: string[];
  correctIndex: number;
  /**
   * Plain-language "what happened" text per wrong option index — authored per-question
   * so diagnosis is accurate and specific, never generated live. Keys are option indexes
   * other than correctIndex.
   */
  misconceptionNotes: Record<number, string>;
  calculatorAvailable?: boolean;
}
