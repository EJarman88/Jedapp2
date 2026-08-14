"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { THEMES } from "@/lib/theme/themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { theme, isPreviewing, setTheme, save } = useTheme();
  const [showSavedToast, setShowSavedToast] = useState(false);

  function handleSave() {
    save();
    setShowSavedToast(true);
  }

  return (
    <div>
      <div className="mb-4 h-6">
        {isPreviewing && (
          <Badge variant="terracotta">👁 Previewing — not saved yet</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map((t) => {
          const selected = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={selected}
              className={cn(
                "relative flex min-h-[108px] flex-col justify-between rounded-2xl border-2 px-4 py-4 text-left transition-transform hover:-translate-y-0.5",
                selected ? "border-terracotta" : "border-transparent",
              )}
              style={{ backgroundColor: t.bg, color: t.ink }}
            >
              {selected && (
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

      <Button className="mt-6 w-full" onClick={handleSave}>
        Save
      </Button>

      <Toast
        show={showSavedToast}
        message="✓ Saved as your background"
        onDismiss={() => setShowSavedToast(false)}
      />
    </div>
  );
}
