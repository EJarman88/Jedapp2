"use client";

import { useState } from "react";
import type { VocabTerm } from "@/content/lessons/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders body text with vocab terms as tappable, keyboard-accessible inline reveals. */
export function VocabText({ text, vocabTerms }: { text: string; vocabTerms: VocabTerm[] }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  if (vocabTerms.length === 0) return <>{text}</>;

  const termByLower = new Map(vocabTerms.map((v) => [v.term.toLowerCase(), v]));
  const pattern = [...vocabTerms]
    .sort((a, b) => b.term.length - a.term.length)
    .map((v) => escapeRegExp(v.term))
    .join("|");
  const parts = text.split(new RegExp(`\\b(${pattern})\\b`, "gi"));

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      {parts.map((part, i) => {
        const term = termByLower.get(part.toLowerCase());
        if (!term) return <span key={i}>{part}</span>;

        const key = `${i}-${term.term}`;
        const open = openKeys.has(key);

        return (
          <span key={i}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(key)}
              className="font-semibold text-ink underline decoration-terracotta decoration-dotted underline-offset-[3px]"
            >
              {part}
            </button>
            {open && (
              <span className="mx-1 my-1.5 inline-flex items-center gap-1.5 rounded-[10px] bg-terracotta-soft px-3 py-1.5 align-middle text-xs font-medium text-terracotta">
                📖 <strong className="capitalize">{term.term}:</strong> {term.definition}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
