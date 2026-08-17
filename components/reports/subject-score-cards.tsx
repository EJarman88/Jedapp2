import { Badge } from "@/components/ui/badge";
import { FUNDED_ATTEMPTS_PER_SUBJECT, GED_READY_PASSING_SCORE, type SubjectScoreCard } from "@/lib/reports/types";

const STATUS_LABEL = { passed: "Passed", in_progress: "In progress", not_started: "Not started" } as const;
const STATUS_VARIANT = { passed: "sage", in_progress: "amber", not_started: "neutral" } as const;

export function SubjectScoreCards({ cards }: { cards: SubjectScoreCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.subject} className="rounded-card border border-line bg-card p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold">{c.subject}</span>
            <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
          </div>

          <div className="mb-2.5 flex items-baseline gap-1.5">
            <span className={c.latestScore === null ? "font-serif text-2xl text-ink-soft" : "font-serif text-2xl font-semibold"}>
              {c.latestScore ?? "—"}
            </span>
            <span className="text-[11px] text-ink-soft">
              {c.latestScore !== null
                ? `/ 200 · attempt ${Math.min(c.attemptCount, FUNDED_ATTEMPTS_PER_SUBJECT)} of ${FUNDED_ATTEMPTS_PER_SUBJECT}`
                : `0 of ${FUNDED_ATTEMPTS_PER_SUBJECT} used`}
            </span>
          </div>

          <div className="flex h-9 items-end gap-1">
            {(c.attempts.length > 0 ? c.attempts : [0]).map((score, i, arr) => (
              <div
                key={i}
                className={
                  "flex-1 rounded-t " +
                  (score >= GED_READY_PASSING_SCORE
                    ? "bg-sage"
                    : i === arr.length - 1 && score > 0
                      ? "bg-terracotta"
                      : "bg-terracotta-soft")
                }
                style={{ height: `${Math.max(8, (score / 200) * 100)}%` }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[10.5px] text-ink-soft">{c.trendText}</p>
        </div>
      ))}
    </div>
  );
}
