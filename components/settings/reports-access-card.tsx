"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { setReportsAccess } from "@/lib/auth/grants";
import type { GrantStatus } from "@/lib/supabase/database.types";

interface ReportsAccessCardProps {
  granteeUserId: string;
  displayName: string;
  initialStatus: GrantStatus;
}

const STATUS_LABEL: Record<GrantStatus, string> = {
  active: "Active",
  inert: "Not yet active",
  revoked: "Revoked",
};

export function ReportsAccessCard({ granteeUserId, displayName, initialStatus }: ReportsAccessCardProps) {
  const [status, setStatus] = useState<GrantStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const active = status === "active";

  function handleToggle(next: boolean) {
    const previous = status;
    setStatus(next ? "active" : "revoked");
    startTransition(async () => {
      try {
        await setReportsAccess(granteeUserId, next);
      } catch {
        setStatus(previous);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-sm font-semibold text-terracotta">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Reports access only — no lessons, no Ask Me (Almost) Anything
          </p>
        </div>
        <Badge variant={active ? "sage" : "neutral"}>{STATUS_LABEL[status]}</Badge>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-sm font-medium">{displayName} can view Reports</span>
        <Toggle
          checked={active}
          onChange={handleToggle}
          disabled={isPending}
          label={`${displayName} can view Reports`}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        You can turn this off anytime — it takes effect immediately. Turning it back on
        later won&rsquo;t require {displayName} to set up a new account.
      </p>
    </div>
  );
}
