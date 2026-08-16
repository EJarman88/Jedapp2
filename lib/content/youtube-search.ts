import "server-only";

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  url: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
}

interface YoutubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
}

interface YoutubeVideoDetailsItem {
  id: string;
  contentDetails: { duration: string };
}

function parseIsoDuration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
}

/**
 * One-off lookup against the (free, quota-limited) YouTube Data API, used only from the
 * admin-only curated-video search — never called at lesson-load time. A human still
 * picks which result, if any, gets added; this just removes the manual hunt-for-a-link
 * step per CLAUDE.md's "curated, not algorithmic" rule for the actual student experience.
 */
export async function searchYoutubeVideos(query: string): Promise<YoutubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube search isn't set up yet — add YOUTUBE_API_KEY to the environment.");
  }
  if (!query.trim()) return [];

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "6");
  searchUrl.searchParams.set("safeSearch", "strict");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error("YouTube search failed. Try again in a moment.");
  }

  const searchData: { items?: YoutubeSearchItem[] } = await searchRes.json();
  const items = searchData.items ?? [];
  if (items.length === 0) return [];

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "contentDetails");
  detailsUrl.searchParams.set("id", items.map((item) => item.id.videoId).join(","));
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl);
  const detailsData: { items?: YoutubeVideoDetailsItem[] } = detailsRes.ok
    ? await detailsRes.json()
    : {};
  const durationById = new Map(
    (detailsData.items ?? []).map((item) => [item.id, parseIsoDuration(item.contentDetails.duration)]),
  );

  return items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    durationSeconds: durationById.get(item.id.videoId) ?? null,
  }));
}
