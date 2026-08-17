import "server-only";

import { getClaudeClient } from "./client";
import { parseImageDataUrl } from "./image-content";

const SYSTEM_PROMPT = `You transcribe handwritten math or written work from an image exactly as written —
numbers, symbols, equations, crossed-out work, everything. Do not solve anything, do not correct errors,
do not add commentary. Respond with the transcription only, nothing else.`;

/** Transcribes a scratch-pad canvas image so it can be shown back to her for
 * confirmation before it's used as the basis for guidance — never guidance based on
 * a misread. */
export async function transcribeHandwriting(imageDataUrl: string): Promise<string> {
  const client = getClaudeClient();
  const { mediaType, data } = parseImageDataUrl(imageDataUrl);

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          { type: "text", text: "Transcribe this exactly as written." },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
}
