"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import type { GedReadySubject } from "@/lib/supabase/database.types";
import { upsertRealTestResult } from "@/lib/reports/actions";

export function RealTestResultForm({
  studentUserId,
  subject,
  initialPassed,
  initialPaidOut,
}: {
  studentUserId: string;
  subject: GedReadySubject;
  initialPassed: boolean;
  initialPaidOut: boolean;
}) {
  const [passed, setPassed] = useState(initialPassed);
  const [paidOut, setPaidOut] = useState(initialPaidOut);
  const [isPending, startTransition] = useTransition();

  function save(nextPassed: boolean, nextPaidOut: boolean) {
    setPassed(nextPassed);
    setPaidOut(nextPaidOut);
    startTransition(() => {
      void upsertRealTestResult(studentUserId, subject, nextPassed, nextPaidOut);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] font-medium">{subject}</span>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-[11px] text-ink-soft">
          Passed real test
          <Toggle
            checked={passed}
            onChange={(next) => save(next, next ? paidOut : false)}
            disabled={isPending}
            label={`${subject} passed real test`}
          />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-ink-soft">
          $75 paid
          <Toggle
            checked={paidOut}
            onChange={(next) => save(passed, next)}
            disabled={isPending || !passed}
            label={`${subject} $75 paid out`}
          />
        </label>
      </div>
    </div>
  );
}
