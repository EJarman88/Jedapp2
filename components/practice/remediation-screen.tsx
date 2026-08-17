"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VocabText } from "@/components/lessons/vocab-text";
import { CheckBlock } from "@/components/lessons/check-block";
import type { RemediationLesson } from "@/content/remediation/types";

export function RemediationScreen({
  lesson,
  onComplete,
}: {
  lesson: RemediationLesson;
  onComplete: (gotItRight: boolean) => void;
}) {
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const contentBlocks = lesson.blocks.filter((b) => b.type === "content");
  const checkBlock = lesson.blocks.find((b) => b.type === "check");

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-1 pb-1.5 pt-2">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-sage">
          Review · Built From Your Misses
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold">{lesson.title}</p>
      </div>

      <div className="my-3.5 h-[5px] shrink-0 overflow-hidden rounded-full bg-line/60">
        <div className="h-full w-full rounded-full bg-sage" />
      </div>

      <div className="flex items-start gap-2.5 pb-4">
        <span className="mt-px text-[15px]">🌱</span>
        <p className="text-[12.5px] italic leading-relaxed text-ink-soft">{lesson.tipLine}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {contentBlocks.map((block, i) =>
          block.type === "content" ? (
            <Card key={i}>
              <h3 className="mb-2 font-serif text-[15px] font-semibold">{block.heading}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">
                <VocabText text={block.body} vocabTerms={lesson.vocabTerms} />
              </p>
            </Card>
          ) : null,
        )}

        {checkBlock && checkBlock.type === "check" && (
          <CheckBlock block={checkBlock} label="Try it once more" onAnswered={setCheckResult} />
        )}
      </div>

      <div className="shrink-0 pt-3.5">
        <Button
          className="w-full"
          disabled={checkResult === null}
          onClick={() => onComplete(checkResult === true)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
