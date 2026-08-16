"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { searchYoutube, addCuratedVideoFromSearch } from "@/lib/content/video-actions";
import type { YoutubeSearchResult } from "@/lib/content/youtube-search";

export function VideoSearch() {
  const [skillTag, setSkillTag] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isSearching, startSearch] = useTransition();
  const [isAdding, startAdd] = useTransition();

  function handleSearch() {
    const q = query.trim() || skillTag.trim();
    if (!q) {
      setError("Enter a skill tag or a search phrase first.");
      return;
    }
    setError(null);
    startSearch(async () => {
      const { results: found, error: searchError } = await searchYoutube(q);
      setResults(found);
      setError(searchError);
    });
  }

  function handleAdd(result: YoutubeSearchResult) {
    if (!skillTag.trim()) {
      setError("Add a skill tag first so this video gets matched to the right lessons.");
      return;
    }
    setError(null);
    startAdd(async () => {
      await addCuratedVideoFromSearch(skillTag, result);
      setAddedIds((prev) => new Set(prev).add(result.videoId));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          Skill tag
          <input
            value={skillTag}
            onChange={(e) => setSkillTag(e.target.value)}
            placeholder="e.g. claims-vs-evidence"
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          Search YouTube for
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. claims vs evidence reading comprehension"
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
          />
        </label>
        <Button type="button" onClick={handleSearch} disabled={isSearching} className="self-end">
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </div>

      {error && <p className="text-xs font-medium text-amber">{error}</p>}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((result) => {
            const added = addedIds.has(result.videoId);
            return (
              <div
                key={result.videoId}
                className="flex items-center gap-3 rounded-xl border border-line bg-card p-2.5"
              >
                {result.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- external thumbnail, not worth next/image config for an admin-only tool
                  <img
                    src={result.thumbnailUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {result.title}
                  </a>
                  <p className="text-xs text-ink-soft">
                    {result.channelName}
                    {result.durationSeconds ? ` · ${Math.round(result.durationSeconds / 60)} min` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={added ? "secondary" : "primary"}
                  onClick={() => handleAdd(result)}
                  disabled={added || isAdding}
                  className="shrink-0"
                >
                  {added ? "Added" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
