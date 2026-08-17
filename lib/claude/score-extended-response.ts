import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { ExtendedResponsePrompt } from "@/content/extended-response/types";
import type { Trait } from "@/lib/supabase/database.types";

export interface TraitScoreResult {
  trait: Trait;
  score: number;
  aiNotesMd: string;
}

const TRAITS: Trait[] = ["argument_analysis", "organization", "language_command", "grammar_conventions"];

const TRAIT_SCHEMA = {
  type: "object" as const,
  properties: {
    score: { type: "integer" as const, description: "1 (minimal) to 4 (strong)" },
    notes: { type: "string" as const, description: "Warm, plain-language, growth-framed feedback." },
  },
  required: ["score", "notes"],
  additionalProperties: false,
};

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    argument_analysis: TRAIT_SCHEMA,
    organization: TRAIT_SCHEMA,
    language_command: TRAIT_SCHEMA,
    grammar_conventions: TRAIT_SCHEMA,
  },
  required: TRAITS,
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You score a GED RLA-style extended response against exactly four rubric traits:

- argument_analysis: Does the response evaluate both passages and take a clear position, using specific evidence from the passages to support it (not just restating the passages)?
- organization: Is the response clearly structured, with a logical progression of ideas and reasonable transitions between them?
- language_command: Is the word choice precise and the sentence structure varied and clear?
- grammar_conventions: Are grammar, spelling, and punctuation under control?

Score each trait 1-4: 1 = minimal, 2 = developing, 3 = proficient, 4 = strong.

For each trait's "notes" field, write warm, specific, growth-framed feedback for the learner herself —
2-3 sentences, plain language, never clinical scorecard phrasing ("Trait 2: 2/3" is wrong; describing
what she did well and naming one concrete way to strengthen it is right). Where it fits naturally, end
with a short question that helps her notice a gap herself rather than a flat correction. Never comment
on her emotional or mental state, motivation, or effort level — score and respond to the writing itself,
nothing else.`;

function buildUserContent(prompt: ExtendedResponsePrompt, rawText: string): string {
  const passages = prompt.passages.map((p) => `${p.label}\n${p.text}`).join("\n\n");
  return `TASK: ${prompt.instructions}\n\n${passages}\n\nSTUDENT RESPONSE:\n${rawText}`;
}

function clampScore(score: number): number {
  return Math.min(4, Math.max(1, Math.round(score)));
}

/**
 * Scores a submitted extended response against the 4 GED RLA rubric traits.
 * trait_scores must survive regardless of what happens to raw_text afterward, so
 * this is called once, immediately, at submission time — not re-derivable later.
 */
export async function scoreExtendedResponse(
  prompt: ExtendedResponsePrompt,
  rawText: string,
): Promise<TraitScoreResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Extended response scoring isn't set up yet — add ANTHROPIC_API_KEY to the environment.");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: RESPONSE_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserContent(prompt, rawText) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Scoring didn't return a result. Try again in a moment.");
  }

  const parsed = JSON.parse(textBlock.text) as Record<Trait, { score: number; notes: string }>;

  return TRAITS.map((trait) => ({
    trait,
    score: clampScore(parsed[trait].score),
    aiNotesMd: parsed[trait].notes,
  }));
}
