import { Card, CardLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

const SUBJECTS = [
  { label: "RLA", value: 78 },
  { label: "Math", value: 45 },
  { label: "Science", value: 60 },
  { label: "Soc. Studies", value: 30 },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="font-serif text-2xl font-medium">Welcome back, Jalisa</h1>
        <p className="mt-1 text-sm text-ink-soft">Tuesday · Day 14 of your plan</p>
      </div>

      <Card>
        <CardLabel>Your progress</CardLabel>
        <div className="flex flex-col gap-3">
          {SUBJECTS.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm font-medium">{s.label}</span>
              <ProgressBar value={s.value} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex cursor-pointer items-center justify-between bg-gradient-to-br from-terracotta-soft to-card">
        <div>
          <p className="font-serif text-base font-semibold">Continue where you left off</p>
          <p className="mt-1 text-xs text-ink-soft">Math · Solving for x with two variables</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
          →
        </span>
      </Card>

      <Card className="bg-sage-soft font-serif italic leading-relaxed">
        &ldquo;If you can&rsquo;t fly then run, if you can&rsquo;t run then walk, if you
        can&rsquo;t walk then crawl, but whatever you do you have to keep moving forward.&rdquo;
        <span className="mt-2 block font-sans not-italic text-xs font-semibold text-ink-soft">
          — Martin Luther King Jr.
        </span>
      </Card>
    </main>
  );
}
