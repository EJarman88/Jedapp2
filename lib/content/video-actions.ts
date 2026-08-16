"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { searchYoutubeVideos, type YoutubeSearchResult } from "@/lib/content/youtube-search";

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

export async function searchYoutube(
  query: string,
): Promise<{ results: YoutubeSearchResult[]; error: string | null }> {
  await requireAdmin();

  try {
    return { results: await searchYoutubeVideos(query), error: null };
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : "Search failed." };
  }
}

export async function addCuratedVideoFromSearch(skillTag: string, result: YoutubeSearchResult): Promise<void> {
  await requireAdmin();
  const trimmedTag = skillTag.trim();
  if (!trimmedTag) return;

  const supabase = await createClient();
  await supabase.from("curated_videos").insert({
    skill_tag: trimmedTag,
    title: result.title,
    youtube_url: result.url,
    channel_name: result.channelName,
    duration_seconds: result.durationSeconds,
  });

  revalidatePath("/videos");
}
