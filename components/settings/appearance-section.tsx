"use client";

import { useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { ThemePicker } from "@/components/theme/theme-picker";
import { ReadAloudSettings } from "@/components/settings/read-aloud-settings";
import { PlanStylePicker } from "@/components/settings/plan-style-picker";
import { useTheme } from "@/lib/theme/theme-context";
import { getTheme } from "@/lib/theme/themes";
import { PLAN_STYLES } from "@/lib/onboarding/plan-styles";
import type { PlanStyle } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Panel = "theme" | "read-aloud" | "plan-style" | null;

function Chevron({ open }: { open: boolean }) {
  return (
    <span className={cn("text-ink-soft transition-transform duration-200", open && "rotate-180")}>⌄</span>
  );
}

export function AppearanceSection({ initialPlanStyle }: { initialPlanStyle: PlanStyle }) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const { theme } = useTheme();
  const themeName = getTheme(theme).name;
  const planStyleTitle = PLAN_STYLES.find((p) => p.id === initialPlanStyle)?.title ?? "Suggested order";

  function toggle(panel: Exclude<Panel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <div>
      <CardLabel className="mb-2 mt-0">Appearance</CardLabel>
      <Card className="flex flex-col gap-0 p-0">
        <button
          type="button"
          onClick={() => toggle("theme")}
          aria-expanded={openPanel === "theme"}
          className="flex w-full items-center justify-between gap-3 border-b border-line px-5 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-medium">🎨 Background theme</span>
            <span className="mt-0.5 block text-xs text-ink-soft">{themeName}</span>
          </span>
          <Chevron open={openPanel === "theme"} />
        </button>
        {openPanel === "theme" && (
          <div className="border-b border-line px-5 py-4">
            <ThemePicker />
          </div>
        )}

        <button
          type="button"
          onClick={() => toggle("read-aloud")}
          aria-expanded={openPanel === "read-aloud"}
          className="flex w-full items-center justify-between gap-3 border-b border-line px-5 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-medium">🔊 Read aloud</span>
            <span className="mt-0.5 block text-xs text-ink-soft">Voice, pitch & speed</span>
          </span>
          <Chevron open={openPanel === "read-aloud"} />
        </button>
        {openPanel === "read-aloud" && (
          <div className="border-b border-line px-5 py-4">
            <ReadAloudSettings />
          </div>
        )}

        <button
          type="button"
          onClick={() => toggle("plan-style")}
          aria-expanded={openPanel === "plan-style"}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-medium">📋 Daily plan style</span>
            <span className="mt-0.5 block text-xs text-ink-soft">{planStyleTitle}</span>
          </span>
          <Chevron open={openPanel === "plan-style"} />
        </button>
        {openPanel === "plan-style" && (
          <div className="px-5 py-4">
            <PlanStylePicker initialPlanStyle={initialPlanStyle} />
          </div>
        )}
      </Card>
    </div>
  );
}
