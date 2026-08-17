import "server-only";

import { getClaudeClient } from "./client";

export interface TalkToClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Feature B — "Talk to Claude." Deliberately no system prompt tying this to EdApp's
 * tutoring persona, and this function never writes to any EdApp table — the whole
 * point is that this conversation lives outside the tracking system (CLAUDE.md
 * rule #6, phase doc Feature B).
 */
export async function getTalkToClaudeReply(history: TalkToClaudeMessage[]): Promise<string> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
