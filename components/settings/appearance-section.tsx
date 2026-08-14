"use client";

import { useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { ThemePicker } from "@/components/theme/theme-picker";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between"
      >
        <CardLabel className="m-0">Appearance</CardLabel>
        <span className={cn("text-ink-soft transition-transform duration-200", open && "rotate-180")}>
          ⌄
        </span>
      </button>

      {open && (
        <Card>
          <p className="mb-1 text-sm font-medium">Background theme</p>
          <p className="mb-4 text-xs text-ink-soft">
            Pick whatever feels easiest to read. You can change this anytime.
          </p>
          <ThemePicker />
        </Card>
      )}
    </div>
  );
}
