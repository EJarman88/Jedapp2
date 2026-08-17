import "server-only";

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Shared Anthropic client — every lib/claude/* wrapper goes through this. */
export function getClaudeClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("This feature isn't set up yet — add ANTHROPIC_API_KEY to the environment.");
  }

  client = new Anthropic({ apiKey });
  return client;
}
