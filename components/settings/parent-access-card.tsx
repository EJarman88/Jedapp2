"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { setParentAccess } from "@/lib/auth/parent-access";

interface ParentAccessCardProps {
  adminDisplayName: string;
  initialEnabled: boolean;
}

export function ParentAccessCard({ adminDisplayName, initialEnabled }: ParentAccessCardProps) {
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
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sm font-semibold">
          {adminDisplayName.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{adminDisplayName}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Reports access only — no lessons, no Ask Me (Almost) Anything
          </p>
        </div>
        <Badge variant={enabled ? "sage" : "neutral"}>{enabled ? "Active" : "Revoked"}</Badge>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-sm font-medium">{adminDisplayName} can view Reports</span>
        <Toggle
          checked={enabled}
          onChange={handleToggle}
          disabled={isPending}
          label={`${adminDisplayName} can view Reports`}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        You can turn this off anytime — it takes effect immediately. Turning it back on
        later won&rsquo;t require {adminDisplayName} to set up a new account.
      </p>
      {error && <p className="mt-2 text-xs font-medium text-terracotta">{error}</p>}
    </div>
  );
}
