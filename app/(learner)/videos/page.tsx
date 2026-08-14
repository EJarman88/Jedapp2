import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { listCuratedVideos } from "@/lib/content/curated-videos";
import { addCuratedVideo, deleteCuratedVideo } from "@/lib/content/video-actions";

export default async function VideosPage() {
  await requireAdmin();
  const videos = await listCuratedVideos();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/settings" aria-label="Back to Settings" className="text-lg text-ink-soft">
            ←
          </Link>
          <h1 className="font-serif text-2xl font-medium">Curated videos</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Manually selected supplementary videos, matched to lessons by skill tag. Never
          pulled live from YouTube search — add rows here ahead of time.
        </p>
      </div>

      <Card>
        <CardLabel>Add a video</CardLabel>
        <form action={addCuratedVideo} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
              Skill tag
              <input
                name="skill_tag"
                required
                placeholder="e.g. claims-vs-evidence"
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
              Title
              <input
                name="title"
                required
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
            YouTube URL
            <input
              name="youtube_url"
              type="url"
              required
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
              Channel name
              <input
                name="channel_name"
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
              Duration (seconds)
              <input
                name="duration_seconds"
                type="number"
                min="0"
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <Button type="submit" className="self-start">
            Add video
          </Button>
        </form>
      </Card>

      <Card>
        <CardLabel>All curated videos ({videos.length})</CardLabel>
        {videos.length === 0 ? (
          <p className="text-sm text-ink-soft">None yet — lessons will show no video card until you add one.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-ink-soft">
                    {video.skillTag}
                    {video.channelName ? ` · ${video.channelName}` : ""}
                    {video.durationSeconds ? ` · ${Math.round(video.durationSeconds / 60)} min` : ""}
                  </p>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-terracotta hover:underline"
                  >
                    {video.youtubeUrl}
                  </a>
                </div>
                <form action={deleteCuratedVideo.bind(null, video.id)}>
                  <button type="submit" className="shrink-0 text-xs font-semibold text-ink-soft hover:text-ink">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
