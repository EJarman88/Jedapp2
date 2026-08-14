"use client";

import { THEMES, type ThemeId } from "@/lib/theme/themes";
import { cn } from "@/lib/utils";

interface ThemeSwatchGridProps {
  selected: ThemeId;
  onSelect: (id: ThemeId) => void;
}

export function ThemeSwatchGrid({ selected, onSelect }: ThemeSwatchGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {THEMES.map((t) => {
        const isSelected = t.id === selected;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={isSelected}
            className={cn(
              "relative flex min-h-[108px] flex-col justify-between rounded-2xl border-2 px-4 py-4 text-left transition-transform hover:-translate-y-0.5",
              isSelected ? "border-terracotta" : "border-transparent",
            )}
            style={{ backgroundColor: t.bg, color: t.ink }}
          >
            {isSelected && (
              <span className="absolute right-2.5 top-2.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-terracotta text-xs text-white">
                ✓
              </span>
            )}
            <span className="text-sm font-medium">Live text preview</span>
            <span className="mt-3 text-sm font-semibold">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
