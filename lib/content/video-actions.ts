"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function addCuratedVideo(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const skillTag = String(formData.get("skill_tag") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const youtubeUrl = String(formData.get("youtube_url") ?? "").trim();
  const channelName = String(formData.get("channel_name") ?? "").trim();
  const durationRaw = String(formData.get("duration_seconds") ?? "").trim();

  if (!skillTag || !title || !youtubeUrl) return;

  await supabase.from("curated_videos").insert({
    skill_tag: skillTag,
    title,
    youtube_url: youtubeUrl,
    channel_name: channelName || null,
    duration_seconds: durationRaw ? Number(durationRaw) : null,
  });

  revalidatePath("/videos");
}

export async function deleteCuratedVideo(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("curated_videos").delete().eq("id", id);

  revalidatePath("/videos");
}
