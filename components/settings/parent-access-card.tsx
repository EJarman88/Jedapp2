"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { setParentAccess } from "@/lib/auth/parent-access";

interface ParentAccessCardProps {
  initialEnabled: boolean;
}

export function ParentAccessCard({ initialEnabled }: ParentAccessCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setParentAccess(next);
      if (result.error) {
        setEnabled(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Let a parent/guardian see your reports</span>
        <Toggle
          checked={enabled}
          onChange={handleToggle}
          disabled={isPending}
          label="Let a parent/guardian see your reports"
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        This is entirely your choice — turn it off anytime, and back on whenever you
        want.
      </p>
      {error && <p className="mt-2 text-xs font-medium text-terracotta">{error}</p>}
    </div>
  );
}
