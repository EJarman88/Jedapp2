import { CardLabel } from "@/components/ui/card";

export function WeeklyDigest({ sentences }: { sentences: string[] }) {
  return (
    <div>
      <CardLabel className="mt-0">📋 Weekly digest</CardLabel>
      <div className="flex flex-col gap-2.5">
        {sentences.map((s, i) => (
          <p key={i} className="text-[13.5px] leading-relaxed">
            {s}
          </p>
        ))}
      </div>
      <div className="mt-3.5 rounded-xl bg-sage-soft p-3 text-[12px] leading-relaxed">
        This summary reflects activity patterns only — never the content of what she writes, and never a
        read on how she&rsquo;s feeling.
      </div>
    </div>
  );
}
