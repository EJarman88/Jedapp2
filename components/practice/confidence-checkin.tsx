"use client";

import { cn } from "@/lib/utils";

const SCALE = [
  { rating: 1, emoji: "😟" },
  { rating: 2, emoji: "😐" },
  { rating: 3, emoji: "🙂" },
  { rating: 4, emoji: "😄" },
];

export function ConfidenceCheckin({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <p className="mb-2.5 text-[12.5px] font-semibold text-ink-soft">{label}</p>}
      <div className="flex gap-2.5">
        {SCALE.map((s) => (
          <button
            key={s.rating}
            type="button"
            aria-pressed={value === s.rating}
            aria-label={`Confidence rating ${s.rating} of 4`}
            onClick={() => onChange(s.rating)}
            className={cn(
              "rounded-xl border-[1.5px] px-4 py-2.5 text-xl transition-colors",
              value === s.rating
                ? "border-terracotta bg-terracotta-soft"
                : "border-line bg-card",
            )}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
