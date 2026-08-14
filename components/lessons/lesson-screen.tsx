"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VocabText } from "@/components/lessons/vocab-text";
import { CheckBlock } from "@/components/lessons/check-block";
import { ReadAloudButton } from "@/components/lessons/read-aloud-button";
import type { Lesson } from "@/content/lessons/types";
import type { CuratedVideo } from "@/lib/content/curated-videos";
import type { LessonProgressStatus } from "@/lib/supabase/database.types";
import { completeLesson } from "@/lib/content/lesson-actions";

function buildReadAloudScript(lesson: Lesson): string {
  const parts = [lesson.title];
  for (const block of lesson.blocks) {
    if (block.type === "content") {
      parts.push(block.heading, block.body);
    }
  }
  return parts.join(". ");
}

export function LessonScreen({
  lesson,
  video,
  initialStatus,
}: {
  lesson: Lesson;
  video: CuratedVideo | null;
  initialStatus: LessonProgressStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answeredChecks, setAnsweredChecks] = useState<Set<number>>(new Set());

  const contentBlocks = lesson.blocks.filter((b) => b.type === "content");
  const checkBlocks = lesson.blocks.filter((b) => b.type === "check");
  const progress =
    checkBlocks.length === 0 ? 100 : Math.round((answeredChecks.size / checkBlocks.length) * 100);
  const alreadyCompleted = initialStatus === "completed";

  function handleContinue() {
    startTransition(async () => {
      await completeLesson(lesson.id);
      router.push("/home");
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pb-1.5 pt-4">
        <Link
          href="/home"
          aria-label="Back to Home"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-[15px]"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-bold uppercase tracking-wider text-terracotta">
            {lesson.subject} · {lesson.topicLabel}
          </p>
          <p className="mt-0.5 truncate font-serif text-[15px] font-semibold">{lesson.title}</p>
        </div>
        <ReadAloudButton text={buildReadAloudScript(lesson)} />
      </div>

      <div className="mx-5 my-3.5 h-[5px] shrink-0 overflow-hidden rounded-full bg-line/60">
        <div
          className="h-full rounded-full bg-terracotta transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-2.5 px-5 pb-4">
        <span className="mt-px text-[15px]">💡</span>
        <p className="text-[12.5px] italic leading-relaxed text-ink-soft">{lesson.tipLine}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        {contentBlocks.map((block, i) =>
          block.type === "content" ? (
            <Card key={i}>
              <h3 className="mb-2 font-serif text-[15px] font-semibold">{block.heading}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">
                <VocabText text={block.body} vocabTerms={lesson.vocabTerms} />
              </p>
              <span className="mt-2 inline-block rounded-lg bg-line/60 px-2.5 py-1 text-[10px] font-semibold text-ink-soft">
                {lesson.standardTag}
              </span>
            </Card>
          ) : null,
        )}

        {video && (
          <Card className="flex items-center gap-3 p-3.5">
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-ink to-ink-soft text-lg text-white"
              aria-label={`Watch ${video.title} on YouTube`}
            >
              ▶
            </a>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-sage">
                Optional · matches this lesson
              </p>
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-[13px] font-semibold leading-snug hover:underline"
              >
                {video.title}
              </a>
              <p className="text-[11px] text-ink-soft">
                {video.durationSeconds ? `${Math.round(video.durationSeconds / 60)} min video` : "Video"} · opens
                in YouTube
              </p>
            </div>
          </Card>
        )}

        {checkBlocks.map((block, i) =>
          block.type === "check" ? (
            <CheckBlock
              key={i}
              block={block}
              onAnswered={() => setAnsweredChecks((prev) => new Set(prev).add(i))}
            />
          ) : null,
        )}
      </div>

      <div className="shrink-0 px-5 pb-6 pt-3.5">
        <Button className="w-full" onClick={handleContinue} disabled={isPending}>
          {isPending ? "Saving…" : alreadyCompleted ? "Continue" : "Mark complete & continue"}
        </Button>
      </div>
    </div>
  );
}
