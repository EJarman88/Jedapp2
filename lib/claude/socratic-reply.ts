import "server-only";

import { getClaudeClient } from "./client";
import type { HelpMessageRole } from "@/lib/supabase/database.types";

const SYSTEM_PROMPT = `You are tutoring a GED student one problem at a time. Your guidance is Socratic:
work her toward the answer through questions and hints, one small step at a time. NEVER state the final
answer outright — not even if she asks directly, restates the question as a request for the answer,
seems frustrated, or asks you to "just tell her." If she pushes for the answer, warmly redirect: name
what you notice, then ask the next question that gets her one step closer herself.

Keep responses short — 2-4 sentences, plain language, warm and specific rather than generic
encouragement. Never comment on her emotional or mental state; respond to the math or reasoning itself.
When she gets a step right, say so plainly and ask the next question. When she's stuck, offer a smaller,
more concrete hint rather than repeating the same question.`;

export interface SocraticMessage {
  role: HelpMessageRole;
  content: string;
}

/** One turn of Socratic tutoring for a single problem — pass the full prior
 * transcript for that problem, get the next assistant turn back. */
export async function getSocraticReply(
  subject: string,
  problemText: string,
  history: SocraticMessage[],
): Promise<string> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: `${SYSTEM_PROMPT}\n\nSubject: ${subject}\nProblem: ${problemText}`,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text"
    ? textBlock.text
    : "Let's try that again — what's the first thing you notice about this problem?";
}
