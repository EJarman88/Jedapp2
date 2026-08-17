import "server-only";

import { createClient } from "@/lib/supabase/server";
import { parseImageDataUrl } from "@/lib/claude/image-content";

const BUCKET = "help-photos";
const SIGNED_URL_TTL_SECONDS = 300;

/** Uploads a photo to the private help-photos bucket under
 * <user_id>/<session_id>/<file> — the path prefix storage RLS keys off of. */
export async function uploadHelpPhoto(
  userId: string,
  sessionId: string,
  fileName: string,
  dataUrl: string,
): Promise<string> {
  const supabase = await createClient();
  const { mediaType, data } = parseImageDataUrl(dataUrl);
  const path = `${userId}/${sessionId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(data, "base64"), { contentType: mediaType, upsert: false });

  if (error) throw new Error(`Could not upload photo: ${error.message}`);
  return path;
}

/** A short-lived signed URL for showing an uploaded photo back to its owner. */
export async function getSignedHelpPhotoUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}
