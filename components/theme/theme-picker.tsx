"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { ThemeSwatchGrid } from "@/components/theme/theme-swatch-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";

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

      <ThemeSwatchGrid selected={theme} onSelect={setTheme} />

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
