import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { ExtendedResponsePrompt } from "./types";

const DATA_DIR = path.join(process.cwd(), "content/extended-response/data");

export const EXTENDED_RESPONSE_PROMPTS: ExtendedResponsePrompt[] = fs
  .readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as ExtendedResponsePrompt);

export function getExtendedResponsePromptById(id: string): ExtendedResponsePrompt | undefined {
  return EXTENDED_RESPONSE_PROMPTS.find((p) => p.id === id);
}

/** The next prompt she hasn't already used, cycling back to the start once she has. */
export function pickNextPrompt(usedPromptIds: string[]): ExtendedResponsePrompt {
  const unused = EXTENDED_RESPONSE_PROMPTS.find((p) => !usedPromptIds.includes(p.id));
  return unused ?? EXTENDED_RESPONSE_PROMPTS[usedPromptIds.length % EXTENDED_RESPONSE_PROMPTS.length];
}
