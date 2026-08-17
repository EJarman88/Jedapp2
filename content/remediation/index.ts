import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { RemediationLesson } from "./types";

const DATA_DIR = path.join(process.cwd(), "content/remediation/data");

// One file per skillTag — discovered the same way content/lessons and content/practice
// are, so adding remediation coverage for a new skill is dropping in a JSON file.
export const REMEDIATION_LESSONS: RemediationLesson[] = fs
  .readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as RemediationLesson);

const BY_SKILL_TAG = new Map(REMEDIATION_LESSONS.map((r) => [r.skillTag, r]));

export function getRemediationLessonBySkillTag(skillTag: string): RemediationLesson | undefined {
  return BY_SKILL_TAG.get(skillTag);
}
