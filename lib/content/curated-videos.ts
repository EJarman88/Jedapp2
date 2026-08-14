import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface CuratedVideo {
  id: string;
  skillTag: string;
  title: string;
  youtubeUrl: string;
  channelName: string | null;
  durationSeconds: number | null;
}

function toView(row: {
  id: string;
  skill_tag: string;
  title: string;
  youtube_url: string;
  channel_name: string | null;
  duration_seconds: number | null;
}): CuratedVideo {
  return {
    id: row.id,
    skillTag: row.skill_tag,
    title: row.title,
    youtubeUrl: row.youtube_url,
    channelName: row.channel_name,
    durationSeconds: row.duration_seconds,
  };
}

/** The one video shown on a lesson screen for its skill tag, or null if none curated yet. */
export async function getVideoForSkillTag(skillTag: string): Promise<CuratedVideo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("curated_videos")
    .select("id, skill_tag, title, youtube_url, channel_name, duration_seconds")
    .eq("skill_tag", skillTag)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? toView(data) : null;
}

/** Admin-only: every curated video, for the internal management page. */
export async function listCuratedVideos(): Promise<CuratedVideo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("curated_videos")
    .select("id, skill_tag, title, youtube_url, channel_name, duration_seconds")
    .order("skill_tag");

  return (data ?? []).map(toView);
}
