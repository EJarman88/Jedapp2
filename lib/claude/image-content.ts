import "server-only";

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/;

export interface ParsedImage {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  data: string;
}

/** Parses a `data:image/...;base64,...` string (from a file input or canvas export). */
export function parseImageDataUrl(dataUrl: string): ParsedImage {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) throw new Error("That doesn't look like a supported image.");

  const mediaType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  return { mediaType: mediaType as ParsedImage["mediaType"], data: match[2] };
}
