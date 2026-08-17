"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceCheckin } from "@/components/practice/confidence-checkin";
import { RemediationScreen } from "@/components/practice/remediation-screen";
import { cn } from "@/lib/utils";
import { quoteForDate } from "@/content/quotes";
import type { Question } from "@/content/practice/types";
import type { RemediationLesson } from "@/content/remediation/types";
import type { SubmitPracticeSetResult } from "@/lib/practice/actions";
import { fetchRemediationLesson, recordConfidenceCheckin, startPracticeSet, submitPracticeSet } from "@/lib/practice/actions";

type Phase = "intro" | "starting" | "question" | "scoring" | "results" | "diagnosis" | "remediation" | "done";

const PASSING_THRESHOLD = 4; // out of 5 — below this, surface the diagnosis path.

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function PracticeFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [preConfidence, setPreConfidence] = useState<number | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const [result, setResult] = useState<SubmitPracticeSetResult | null>(null);
  const [postConfidence, setPostConfidence] = useState<number | null>(null);
  const [remediationLesson, setRemediationLesson] = useState<RemediationLesson | null>(null);
  const [remediationGotItRight, setRemediationGotItRight] = useState<boolean | null>(null);

  const finishSet = useCallback(() => {
    if (!sessionId) return;
    setPhase("scoring");
    const payload = questions.map((q, i) => ({ questionId: q.id, selectedIndex: answers[i] }));
    void submitPracticeSet(sessionId, payload).then((res) => {
      setResult(res);
      setPhase("results");
    });
  }, [sessionId, questions, answers]);

  useEffect(() => {
    if (phase !== "question") return;
    if (secondsLeft <= 0) {
      // Deferred so the timer effect itself never calls setState synchronously —
      // this fires the auto-submit on the next tick instead.
      const id = setTimeout(finishSet, 0);
      return () => clearTimeout(id);
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft, finishSet]);

  async function handleBegin() {
    setPhase("starting");
    const started = await startPracticeSet();
    setSessionId(started.sessionId);
    setQuestions(started.questions);
    setSecondsLeft(started.timeLimitSeconds);
    setAnswers(new Array(started.questions.length).fill(null));
    setCurrentIndex(0);
    setPhase("question");

    if (preConfidence !== null) {
      void recordConfidenceCheckin("practice_session", started.sessionId, preConfidence, "pre");
    }
  }

  function selectAnswer(index: number) {
    setAnswers((prev) => prev.map((a, i) => (i === currentIndex ? index : a)));
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishSet();
    }
  }

  function handleExit() {
    if (window.confirm("Leave this practice set? Your progress on this attempt won't be saved.")) {
      router.push("/home");
    }
  }

  function handleSeeWhatToWorkOn() {
    setPhase("diagnosis");
  }

  async function handleStartRemediation(skillTag: string) {
    const lesson = await fetchRemediationLesson(skillTag);
    setRemediationLesson(lesson);
    setPhase("remediation");
  }

  function handleRemediationComplete(gotItRight: boolean) {
    setRemediationGotItRight(gotItRight);
    setPhase("done");
  }

  function handlePostConfidence(rating: number) {
    setPostConfidence(rating);
    if (sessionId) void recordConfidenceCheckin("practice_session", sessionId, rating, "post");
  }

  // ---- INTRO -------------------------------------------------------------
  if (phase === "intro" || phase === "starting") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-1 py-10 text-center">
        <Badge variant="terracotta">Confidence check-in</Badge>
        <div>
          <h1 className="font-serif text-2xl font-medium">Ready for timed practice?</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            5 questions, 5 minutes — same pacing pressure as the real GED. How are you feeling about this
            one?
          </p>
        </div>
        <ConfidenceCheckin value={preConfidence} onChange={setPreConfidence} />
        <Button
          className="w-full max-w-xs"
          disabled={phase === "starting"}
          onClick={handleBegin}
        >
          {phase === "starting" ? "Getting your questions ready…" : "Begin Practice Set"}
        </Button>
      </main>
    );
  }

  // ---- TIMED QUESTIONS -----------------------------------------------------
  if (phase === "question" || phase === "scoring") {
    const question = questions[currentIndex];
    const selected = answers[currentIndex];
    const urgent = secondsLeft <= 60;

    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between pb-2.5 pt-1">
          <button type="button" onClick={handleExit} aria-label="Exit practice" className="text-lg text-ink-soft">
            ✕
          </button>
          <span className="text-xs font-semibold text-ink-soft">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-bold",
              urgent ? "border-amber bg-amber-soft text-ink" : "border-line bg-card",
            )}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-amber" />
            {formatClock(secondsLeft)}
          </span>
        </div>

        <div className="mb-4 flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < currentIndex ? "bg-sage" : i === currentIndex ? "bg-terracotta" : "bg-line/60",
              )}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
          {question.stimulus && (
            <Card className="text-[13px] leading-relaxed text-ink-soft">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-soft">
                {question.subject}
              </p>
              {question.stimulus}
            </Card>
          )}

          <div>
            <p className="mb-4 font-serif text-base font-medium leading-snug">{question.question}</p>
            {question.calculatorAvailable && (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-line/60 px-3 py-1.5 text-[11px] font-semibold text-ink-soft">
                🖩 Calculator available
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {question.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(i)}
                disabled={phase === "scoring"}
                aria-pressed={selected === i}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-card px-4 py-3.5 text-left text-[13.5px] font-medium",
                  selected === i && "border-terracotta bg-terracotta-soft",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-card text-[11.5px] font-bold",
                    selected === i && "border-terracotta bg-terracotta text-white",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 gap-2.5 pt-3.5">
          <button
            type="button"
            onClick={toggleFlag}
            className={cn(
              "shrink-0 rounded-2xl border border-line bg-card px-4 py-3.5 text-[13px] font-semibold",
              flagged.has(currentIndex) ? "border-amber bg-amber-soft text-ink" : "text-ink-soft",
            )}
          >
            🚩 {flagged.has(currentIndex) ? "Flagged" : "Flag"}
          </button>
          <Button
            className="flex-1"
            disabled={selected === null || phase === "scoring"}
            onClick={handleNext}
          >
            {phase === "scoring"
              ? "Scoring…"
              : currentIndex === questions.length - 1
                ? "Finish"
                : "Next Question"}
          </Button>
        </div>
      </main>
    );
  }

  // ---- RESULTS ---------------------------------------------------------
  if (phase === "results" && result) {
    const quote = quoteForDate(new Date(), "resilience");
    const pct = Math.round((result.score / result.total) * 100);
    const strong = result.score >= PASSING_THRESHOLD;

    const headline = strong ? "Strong set" : result.score >= 2 ? "Good progress" : "Good starting point";
    const sub = strong
      ? "You're reading these questions carefully and it shows. Let's keep this pace going."
      : result.score >= 2
        ? "A solid step — a couple of these are worth revisiting together, not a sign anything's wrong."
        : "This is exactly what practice is for — finding what to work on next, not a final verdict.";

    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center gap-5 px-1 py-8 text-center">
        <div
          className="flex h-[130px] w-[130px] items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#7C9270 0% ${pct}%, #EFDCCF ${pct}% 100%)` }}
        >
          <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-card">
            <span className="font-serif text-3xl font-semibold">
              {result.score}/{result.total}
            </span>
            <span className="text-[11px] text-ink-soft">correct</span>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold">{headline}</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">{sub}</p>
        </div>

        <Card className="w-full bg-sage-soft text-left font-serif text-[13px] italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
          <span className="mt-2 block font-sans not-italic text-[11px] font-semibold text-ink-soft">
            — {quote.attribution}
          </span>
        </Card>

        <div className="w-full">
          <ConfidenceCheckin
            value={postConfidence}
            onChange={handlePostConfidence}
            label="How are you feeling now?"
          />
        </div>

        <div className="flex w-full flex-col gap-2.5">
          {!strong && (
            <Button className="w-full bg-sage hover:opacity-90" onClick={handleSeeWhatToWorkOn}>
              See What To Work On
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={() => router.push("/home")}>
            Back to Home
          </Button>
        </div>
      </main>
    );
  }

  // ---- DIAGNOSIS ---------------------------------------------------------
  if (phase === "diagnosis" && result) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 pb-4">
        <h1 className="font-serif text-xl font-medium">What this tells us</h1>

        <Card className="bg-terracotta-soft">
          <p className="text-[13px] leading-relaxed">
            Missed questions aren&rsquo;t random — EdApp looks at <em>what kind</em> of thinking each one
            needed, to find the actual pattern underneath.
          </p>
        </Card>

        {result.missed.map((m) => (
          <Card key={m.questionId}>
            <h3 className="text-[13.5px] font-semibold">{m.subject}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed">
              <strong>Question asked:</strong> {m.questionText}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed">
              <strong>What happened:</strong> {m.whatHappened}
            </p>
            <span className="mt-2 inline-block rounded-lg bg-line/60 px-2.5 py-1 text-[10px] font-semibold text-ink-soft">
              {m.skillLabel}
            </span>
          </Card>
        ))}

        {result.commonThread && (
          <Card className="border-[1.5px] border-sage">
            <h3 className="font-serif text-[15px] font-semibold text-sage">The common thread</h3>
            <p className="mt-2 text-[13px] leading-relaxed">{result.commonThread.message}</p>
            <Badge variant="sage" className="mt-2">
              {result.commonThread.skillLabel}
            </Badge>
          </Card>
        )}

        <Button
          className="mt-1 w-full"
          onClick={() => result.commonThread && handleStartRemediation(result.commonThread.skillTag)}
        >
          Let&rsquo;s rebuild this together
        </Button>
      </main>
    );
  }

  // ---- REMEDIATION -------------------------------------------------------
  if (phase === "remediation") {
    if (!remediationLesson) {
      return (
        <main className="mx-auto flex max-w-md flex-1 items-center justify-center">
          <p className="text-sm text-ink-soft">Loading your review…</p>
        </main>
      );
    }
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col">
        <RemediationScreen lesson={remediationLesson} onComplete={handleRemediationComplete} />
      </main>
    );
  }

  // ---- DONE / COMPLETION ---------------------------------------------------
  if (phase === "done" && result?.commonThread) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center gap-5 px-1 py-10 text-center">
        <span className="text-5xl">🌱</span>
        <div>
          <h2 className="font-serif text-xl font-semibold">
            {remediationGotItRight ? "That's the pattern" : "Good rep either way"}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">
            {remediationGotItRight
              ? "Same skill as the missed questions earlier — this time it landed. That's what this review was for."
              : "Same skill as the missed questions earlier — worth another pass soon. That's exactly what review is for."}
          </p>
        </div>

        <Card className="w-full text-left">
          <div className="flex items-center gap-2.5 border-b border-line py-2 text-sm">
            <span>🟠</span>
            <span>First attempt — missed this pattern ({result.commonThread.skillLabel})</span>
          </div>
          <div className="flex items-center gap-2.5 py-2 text-sm">
            <span>{remediationGotItRight ? "✅" : "🟠"}</span>
            <span>Just now — {remediationGotItRight ? "got it" : "still working on it"}</span>
          </div>
        </Card>

        <p className="text-xs text-ink-soft">
          This is what &ldquo;you vs. your last attempt&rdquo; looks like — not a score in isolation.
        </p>

        <Button className="w-full" onClick={() => router.push("/home")}>
          Back to Home
        </Button>
      </main>
    );
  }

  return null;
}
