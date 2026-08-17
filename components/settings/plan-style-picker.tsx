"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { PLAN_STYLES } from "@/lib/onboarding/plan-styles";
import { updatePlanStyle } from "@/lib/settings/plan-style";
import type { PlanStyle } from "@/lib/supabase/database.types";

export function PlanStylePicker({ initialPlanStyle }: { initialPlanStyle: PlanStyle }) {
  const [planStyle, setPlanStyle] = useState(initialPlanStyle);
  const [isPending, startTransition] = useTransition();

  function select(next: PlanStyle) {
    if (next === planStyle) return;
    setPlanStyle(next);
    startTransition(() => {
      void updatePlanStyle(next);
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PLAN_STYLES.map((p) => {
        const selected = p.id === planStyle;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p.id)}
            disabled={isPending}
            aria-pressed={selected}
            className={cn(
              "rounded-2xl border-2 px-4 py-3.5 text-left transition-colors disabled:opacity-60",
              selected ? "border-terracotta bg-terracotta-soft" : "border-line bg-card",
            )}
          >
            <p className="text-sm font-semibold">{p.title}</p>
            <p className="mt-1 text-xs text-ink-soft">{p.description}</p>
          </button>
        );
      })}
    </div>
  );
}
