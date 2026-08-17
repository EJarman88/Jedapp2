import type { CheckBlock, ContentBlock, LessonBlock, Subject, VocabTerm } from "@/content/lessons/types";

export type { CheckBlock, ContentBlock, LessonBlock, VocabTerm };

/**
 * A scaffolded, more-broken-down rebuild of a skill — distinct content from the main
 * curriculum lesson on the same skill (per the phase doc), keyed by skillTag rather
 * than a standalone slug since it's always reached from a missed-question diagnosis.
 * Same block shape as content/lessons (content/check) so the same VocabText/CheckBlock
 * rendering can be reused: a framework block, a worked example, then exactly one fresh
 * check question.
 */
export interface RemediationLesson {
  skillTag: string;
  subject: Subject;
  title: string;
  tipLine: string;
  vocabTerms: VocabTerm[];
  blocks: LessonBlock[];
}
