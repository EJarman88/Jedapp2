"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addGedReadyScore } from "@/lib/practice/ged-ready-actions";
import { GED_READY_PASSING_SCORE, type GedReadyScoreView } from "@/lib/practice/ged-ready-types";
import type { GedReadySubject } from "@/lib/supabase/database.types";

const SUBJECTS: GedReadySubject[] = ["RLA", "Math", "Science", "Social Studies"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GedReadyForm({ scores }: { scores: GedReadyScoreView[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState<GedReadySubject>("RLA");
  const [score, setScore] = useState("");
  const [takenAt, setTakenAt] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(scores.length === 0);

  const attemptNumber = scores.filter((s) => s.subject === subject).length + 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(score);
    if (!Number.isInteger(parsed)) {
      setError("Enter a whole number score.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addGedReadyScore({ subject, score: parsed, attemptNumber, takenAt });
      if (result.error) {
        setError(result.error);
        return;
      }
      setScore("");
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div>
      <CardLabel className="mb-2 mt-0">GED Ready Scores</CardLabel>
      <Card className="flex flex-col gap-3.5">
        {scores.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {scores.map((s) => {
              const passed = s.score >= GED_READY_PASSING_SCORE;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-line pb-2.5 text-sm last:border-b-0 last:pb-0"
                >
                  <div>
                    <span className="font-medium">{s.subject}</span>
                    <span className="ml-2 text-xs text-ink-soft">
                      Attempt {s.attemptNumber} · {s.takenAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-semibold">{s.score}</span>
                    <Badge variant={passed ? "sage" : "amber"}>{passed ? "Passed" : "In progress"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2.5">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as GedReadySubject)}
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={100}
                max={200}
                required
                placeholder="Score (100–200)"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-36 rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
              />
            </div>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              max={todayISO()}
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
            />
            {error && <p className="text-xs font-medium text-amber">{error}</p>}
            <p className="text-xs text-ink-soft">
              This will be logged as attempt {attemptNumber} for {subject}.
            </p>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving…" : "Save Score"}
            </Button>
          </form>
        ) : (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            + Log a new GED Ready score
          </Button>
        )}
      </Card>
    </div>
  );
}
