import { CardLabel } from "@/components/ui/card";
import type { GedReadySubject } from "@/lib/supabase/database.types";
import type { IncentiveProgress as IncentiveProgressData } from "@/lib/reports/types";
import { RealTestResultForm } from "./real-test-result-form";

const STATUS_LABEL = { earned: "$75 earned", in_progress: "In progress", not_started: "Not started" } as const;

export function IncentiveProgress({
  data,
  editable,
  studentUserId,
}: {
  data: IncentiveProgressData;
  editable: boolean;
  studentUserId: string;
}) {
  const pct = Math.round((data.earnedDollars / data.totalDollars) * 100);

  return (
    <div>
      <CardLabel className="mt-0">🏆 Incentive progress</CardLabel>
      <div className="flex flex-col gap-2">
        {data.rows.map((row) => (
          <div key={row.subject} className="flex items-center justify-between text-[13.5px]">
            <span className="flex items-center gap-2 font-medium">
              <span
                className={`h-2 w-2 rounded-full ${row.status === "earned" ? "bg-sage" : "bg-amber"}`}
              />
              {row.subject}
            </span>
            <span className={row.status === "earned" ? "text-sm font-semibold text-sage" : "text-[13px] text-ink-soft"}>
              {STATUS_LABEL[row.status]}
              {row.status === "earned" && !row.paidOut ? " · not yet paid" : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#7C9270 0% ${pct}%, #E7DFD1 ${pct}% 100%)` }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-[11px] font-bold">
            {pct}%
          </div>
        </div>
        <div>
          <p className="font-serif text-lg font-semibold">
            ${data.earnedDollars} of ${data.totalDollars}
          </p>
          <p className="text-xs text-ink-soft">earned so far</p>
        </div>
      </div>

      {editable && (
        <div className="mt-4 flex flex-col gap-1 border-t border-line pt-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Update real test results
          </p>
          {data.rows.map((row) => (
            <RealTestResultForm
              key={row.subject}
              studentUserId={studentUserId}
              subject={row.subject as GedReadySubject}
              initialPassed={row.status === "earned"}
              initialPaidOut={row.paidOut}
            />
          ))}
        </div>
      )}
    </div>
  );
}
