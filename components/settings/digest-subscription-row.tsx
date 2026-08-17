"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { setDigestSubscription } from "@/lib/settings/actions";

export function DigestSubscriptionRow({
  granteeUserId,
  displayName,
  initialEnabled,
}: {
  granteeUserId: string;
  displayName: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setDigestSubscription(granteeUserId, next);
      if (result.error) setEnabled(previous);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-[13.5px] font-medium">Send {displayName} a weekly summary</p>
        <p className="mt-0.5 text-[11.5px] text-ink-soft">
          Plain-language activity notes — separate from full Reports access
        </p>
      </div>
      <Toggle
        checked={enabled}
        onChange={handleToggle}
        disabled={isPending}
        label={`Send ${displayName} a weekly summary`}
      />
    </div>
  );
}
