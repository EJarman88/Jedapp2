"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-context";
import { ThemeSwatchGrid } from "@/components/theme/theme-swatch-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { PLAN_STYLES } from "@/lib/onboarding/plan-styles";
import type { PlanStyle } from "@/lib/supabase/database.types";

export function OnboardingWizard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [planStyle, setPlanStyle] = useState<PlanStyle>("suggested");
  const [isPending, startTransition] = useTransition();

  function handleFinish() {
    startTransition(async () => {
      await completeOnboarding(theme, planStyle);
      router.replace("/home");
    });
  }

  if (step === 1) {
    return (
      <div>
        <h1 className="font-serif text-xl font-medium">Make it yours</h1>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-ink-soft">
          Pick whatever feels easiest to read. You can change this anytime.
        </p>

        <ThemeSwatchGrid selected={theme} onSelect={setTheme} />

        <Button className="mt-6 w-full" onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-xl font-medium">How do you want your days to work?</h1>
      <p className="mb-5 mt-1 text-sm leading-relaxed text-ink-soft">
        This is just a starting point — change it anytime from Settings.
      </p>

      <div className="flex flex-col gap-2.5">
        {PLAN_STYLES.map((p) => {
          const selected = p.id === planStyle;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanStyle(p.id)}
              aria-pressed={selected}
              className={cn(
                "rounded-2xl border-2 px-4 py-3.5 text-left transition-colors",
                selected ? "border-terracotta bg-terracotta-soft" : "border-line bg-card",
              )}
            >
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-xs text-ink-soft">{p.description}</p>
            </button>
          );
        })}
      </div>

      <Button className="mt-6 w-full" onClick={handleFinish} disabled={isPending}>
        {isPending ? "Saving…" : "Finish"}
      </Button>
    </div>
  );
}
