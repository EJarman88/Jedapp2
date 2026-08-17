import "server-only";

import { getClaudeClient } from "./client";
import { parseImageDataUrl } from "./image-content";

const SCHEMA = {
  type: "object" as const,
  properties: {
    problems: {
      type: "array" as const,
      description: "Every distinct problem found, in the order they appear across all images.",
      items: { type: "string" as const, description: "The full problem statement, transcribed exactly." },
    },
  },
  required: ["problems"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You read photos of homework problems and transcribe each distinct problem exactly as
written — do not solve them, do not summarize them, do not skip any. If a photo shows multiple problems,
list each one separately in the order they appear. If a photo shows one problem split across several
images (e.g. a long word problem), transcribe it as a single combined problem. Transcribe faithfully,
including any numbers, symbols, or diagrams described in words — do not correct or reinterpret anything.`;

/** Extracts every distinct problem across one or more photos, in reading order. */
export async function extractProblemsFromImages(imageDataUrls: string[]): Promise<string[]> {
  if (imageDataUrls.length === 0) return [];

  const client = getClaudeClient();
  const imageBlocks = imageDataUrls.map((url) => {
    const { mediaType, data } = parseImageDataUrl(url);
    return { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data } };
  });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          { type: "text", text: "Transcribe every problem shown across these image(s), in order." },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as { problems: string[] };
  return parsed.problems.filter((p) => p.trim().length > 0);
}
