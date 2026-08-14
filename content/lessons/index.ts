import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Lesson } from "./types";

const DATA_DIR = path.join(process.cwd(), "content/lessons/data");

// The full curriculum, discovered from every *.json file under content/lessons/data —
// adding a lesson is: drop a new JSON file in that folder. No code changes, no import
// to add, nothing to register.
export const LESSONS: Lesson[] = fs
  .readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as Lesson);

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === slug);
}

export function getLessonsBySubject(subject: Lesson["subject"]): Lesson[] {
  return LESSONS.filter((lesson) => lesson.subject === subject);
}
