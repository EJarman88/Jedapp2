export type Subject = "RLA" | "Math" | "Science" | "Social Studies";

export interface VocabTerm {
  term: string;
  definition: string;
}

export interface ContentBlock {
  type: "content";
  heading: string;
  body: string;
}

export interface CheckBlock {
  type: "check";
  question: string;
  options: string[];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export type LessonBlock = ContentBlock | CheckBlock;

export interface Lesson {
  /** Stable slug — used as the URL segment and the lesson_progress/curated_videos key. */
  id: string;
  subject: Subject;
  topicLabel: string;
  title: string;
  standardTag: string;
  /** Matches curated_videos.skill_tag — topic-level, reused across lessons. */
  skillTag: string;
  tipLine: string;
  vocabTerms: VocabTerm[];
  blocks: LessonBlock[];
}
