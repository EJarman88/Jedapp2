import { CardLabel } from "@/components/ui/card";
import type { ConfidenceVsActual } from "@/lib/reports/types";

const WIDTH = 240;
const HEIGHT = 110;

function toPoints(values: number[]): string {
  if (values.length === 0) return "";
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;
  return values.map((v, i) => `${Math.round(i * step)},${Math.round(HEIGHT - (v / 100) * HEIGHT)}`).join(" ");
}

export function ConfidenceChart({ data }: { data: ConfidenceVsActual }) {
  if (data.points.length === 0) {
    return (
      <div>
        <CardLabel className="mt-0">🎯 Confidence vs. actual</CardLabel>
        <p className="text-sm text-ink-soft">Not enough practice sets with a confidence check-in yet.</p>
      </div>
    );
  }

  const predicted = toPoints(data.points.map((p) => p.predicted));
  const actual = toPoints(data.points.map((p) => p.actual));

  return (
    <div>
      <CardLabel className="mt-0">🎯 Confidence vs. actual</CardLabel>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-[110px] w-full">
        <polyline points={predicted} fill="none" stroke="#B7BFAE" strokeWidth={3} strokeLinecap="round" />
        <polyline points={actual} fill="none" stroke="#C1704F" strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div className="mt-2.5 flex gap-4 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#B7BFAE" }} />
          Predicted confidence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />
          Actual score
        </span>
      </div>
    </div>
  );
}
