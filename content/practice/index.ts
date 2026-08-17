import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Question } from "./types";

const DATA_DIR = path.join(process.cwd(), "content/practice/data");

// The full question bank, discovered from every *.json file under content/practice/data
// (one file per subject) — same "drop a file, no code changes" pattern as content/lessons.
export const QUESTIONS: Question[] = fs
  .readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as Question[]);

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS_BY_ID.get(id);
}

export function getQuestionsByIds(ids: string[]): Question[] {
  return ids
    .map((id) => QUESTIONS_BY_ID.get(id))
    .filter((q): q is Question => q !== undefined);
}

/** A fresh, randomly-drawn practice set — no repeats within a set. */
export function drawPracticeSet(count: number): Question[] {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
