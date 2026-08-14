import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AgendaCard } from "@/components/home/agenda-card";
import { requireStudent } from "@/lib/auth/session";
import { getTodayAgenda } from "@/lib/agenda/data";
import { quoteForDate } from "@/content/quotes";

// Stub — real completion data comes from Phase 4/5's curriculum/practice engines.
const SUBJECTS = [
  { label: "RLA", value: 78 },
  { label: "Math", value: 45 },
  { label: "Science", value: 60 },
  { label: "Soc. Studies", value: 30 },
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function HomePage() {
  const user = await requireStudent();
  const planStyle = user.planStyle ?? "suggested";
  const agenda = await getTodayAgenda(user.id, planStyle);
  const quote = quoteForDate(new Date());

  const today = new Date();
  const dayOfWeek = DAY_NAMES[today.getDay()];
  const dayOfPlan = Math.max(
    1,
    Math.floor((today.getTime() - new Date(user.createdAt).getTime()) / 86_400_000) + 1,
  );

  const nextItem = agenda.find((item) => item.status !== "done");
  const nextItemHref =
    nextItem?.itemType === "lesson" && nextItem.contentSlug
      ? `/lessons/${nextItem.contentSlug}`
      : "/practice";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="font-serif text-2xl font-medium">Welcome back, {user.displayName}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {dayOfWeek} · Day {dayOfPlan} of your plan
        </p>
      </div>

      <AgendaCard items={agenda} />

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

      {nextItem && (
        <Link href={nextItemHref}>
          <Card className="flex cursor-pointer items-center justify-between bg-gradient-to-br from-terracotta-soft to-card">
            <div>
              <p className="font-serif text-base font-semibold">Continue where you left off</p>
              <p className="mt-1 text-xs text-ink-soft">
                {nextItem.subject ? `${nextItem.subject} · ${nextItem.title}` : nextItem.title}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
              →
            </span>
          </Card>
        </Link>
      )}

      <Card className="bg-sage-soft font-serif italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
        <span className="mt-2 block font-sans not-italic text-xs font-semibold text-ink-soft">
          — {quote.attribution}
        </span>
      </Card>
    </main>
  );
}
