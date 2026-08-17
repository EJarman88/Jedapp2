import { CardLabel } from "@/components/ui/card";
import type { Trait } from "@/lib/supabase/database.types";
import type { TraitTrends as TraitTrendsData } from "@/lib/reports/types";

const TRAIT_LABELS: Record<Trait, string> = {
  argument_analysis: "Argument Analysis",
  organization: "Organization",
  language_command: "Language Command",
  grammar_conventions: "Grammar & Conventions",
};

export function TraitTrends({ data }: { data: TraitTrendsData }) {
  return (
    <div>
      <CardLabel className="mt-0">✍️ Extended response — trait trends</CardLabel>
      <div className="grid grid-cols-4 gap-2.5">
        {data.traits.map((t) => (
          <div key={t.trait} className="text-center">
            <p className="mb-2 h-7 text-[10.5px] font-semibold leading-tight text-ink-soft">
              {TRAIT_LABELS[t.trait]}
            </p>
            <div className="flex h-11 items-end justify-center gap-[3px]">
              {(t.scores.length > 0 ? t.scores : [0]).map((score, i, arr) => (
                <div
                  key={i}
                  className={`w-2 rounded-t ${
                    i === arr.length - 1 && score >= 3 ? "bg-sage" : "bg-terracotta-soft"
                  }`}
                  style={{ height: `${Math.max(8, (score / 4) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-dashed border-line bg-background px-3.5 py-3 text-[11.5px] text-ink-soft">
        <span>🔒</span>
        <span>
          {data.totalResponses} response{data.totalResponses === 1 ? "" : "s"} logged · {data.sharedCount} shared ·{" "}
          {data.privateCount} kept private — structured scores only, full text not visible here.
        </span>
      </div>
    </div>
  );
}
