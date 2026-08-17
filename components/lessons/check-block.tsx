"use client";

import { useState } from "react";
import type { CheckBlock as CheckBlockData } from "@/content/lessons/types";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

export function CheckBlock({
  block,
  label = "Quick check",
  onAnswered,
}: {
  block: CheckBlockData;
  label?: string;
  onAnswered?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === block.correctIndex;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswered?.(index === block.correctIndex);
  }

  return (
    <div className="rounded-card bg-terracotta-soft p-5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-terracotta">{label}</p>
      <p className="mb-3.5 font-serif text-[15px] font-medium leading-snug">{block.question}</p>
      <div className="flex flex-col gap-2">
        {block.options.map((option, index) => {
          const isCorrectOption = index === block.correctIndex;
          const isWrongSelection = answered && index === selected && !isCorrectOption;
          const revealCorrect = answered && isCorrectOption;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={answered}
              aria-pressed={index === selected}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-card px-3.5 py-3 text-left text-[13.5px] font-medium disabled:cursor-default",
                revealCorrect && "border-sage bg-sage-soft",
                isWrongSelection && "border-ink-soft",
              )}
            >
              <span
                className={cn(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-line/60 text-[11.5px] font-bold",
                  revealCorrect && "bg-sage text-white",
                )}
              >
                {LETTERS[index]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <p
          className={cn(
            "mt-2.5 flex items-start gap-2 text-[12.5px] font-semibold leading-snug",
            correct ? "text-sage" : "text-amber",
          )}
        >
          <span>{correct ? "✓" : "→"}</span>
          <span>{correct ? block.feedbackCorrect : block.feedbackIncorrect}</span>
        </p>
      )}
    </div>
  );
}
