"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExtendedResponsePrompt } from "@/content/extended-response/types";
import type { Trait } from "@/lib/supabase/database.types";
import type { TraitScoreView } from "@/lib/extended-response/types";
import {
  decideExtendedResponsePrivacy,
  submitExtendedResponse,
  type PrivacyDecision,
} from "@/lib/extended-response/actions";

type Phase = "intro" | "writing" | "scoring" | "feedback" | "privacy-choice" | "shared-link" | "done";

const MIN_WORDS = 50;

const TRAIT_LABELS: Record<Trait, string> = {
  argument_analysis: "Argument Analysis",
  organization: "Organization",
  language_command: "Language Command",
  grammar_conventions: "Grammar & Conventions",
};

function wordCount(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

export function WritingFlow({ prompt }: { prompt: ExtendedResponsePrompt }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [rawText, setRawText] = useState("");
  const [responseId, setResponseId] = useState<string | null>(null);
  const [traitScores, setTraitScores] = useState<TraitScoreView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewerLabel, setReviewerLabel] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [decidingBusy, setDecidingBusy] = useState<PrivacyDecision | null>(null);

  const words = wordCount(rawText);

  async function handleSubmit() {
    setError(null);
    setPhase("scoring");
    try {
      const result = await submitExtendedResponse(prompt.id, rawText);
      setResponseId(result.responseId);
      setTraitScores(result.traitScores);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong scoring your response.");
      setPhase("writing");
    }
  }

  async function handleDecide(decision: PrivacyDecision) {
    if (!responseId) return;
    setError(null);
    setDecidingBusy(decision);
    const result = await decideExtendedResponsePrivacy(
      responseId,
      decision,
      decision === "shared" ? reviewerLabel : undefined,
    );
    setDecidingBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (decision === "shared" && result.shareToken) {
      setShareUrl(`${window.location.origin}/review/${result.shareToken}`);
      setPhase("shared-link");
    } else {
      setPhase("done");
    }
  }

  // ---- INTRO ---------------------------------------------------------------
  if (phase === "intro") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
            RLA · Extended Response
          </p>
          <h1 className="mt-1 font-serif text-xl font-medium">{prompt.title}</h1>
        </div>

        <Card>
          <CardLabel className="mt-0">Task</CardLabel>
          <p className="text-[13px] leading-relaxed">{prompt.instructions}</p>
        </Card>

        {prompt.passages.map((p) => (
          <Card key={p.label} className="text-[13px] leading-relaxed text-ink-soft">
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-soft">
              {p.label}
            </p>
            {p.text}
          </Card>
        ))}

        <Button className="w-full" onClick={() => setPhase("writing")}>
          Begin Writing
        </Button>
      </main>
    );
  }

  // ---- WRITING --------------------------------------------------------------
  if (phase === "writing" || phase === "scoring") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-3 pb-6">
        <h1 className="font-serif text-lg font-medium">{prompt.title}</h1>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={phase === "scoring"}
          placeholder="Write your response here…"
          className="min-h-[280px] flex-1 resize-none rounded-2xl border-[1.5px] border-line bg-card p-4 text-[13.5px] leading-relaxed focus:border-terracotta focus:outline-none"
        />
        <p className="text-xs text-ink-soft">
          {words} word{words === 1 ? "" : "s"}
          {words < MIN_WORDS && ` · aim for at least ${MIN_WORDS} before submitting`}
        </p>
        {error && <p className="text-xs font-medium text-amber">{error}</p>}
        <Button
          className="w-full"
          disabled={words < MIN_WORDS || phase === "scoring"}
          onClick={handleSubmit}
        >
          {phase === "scoring" ? "Scoring your response…" : "Submit for Feedback"}
        </Button>
      </main>
    );
  }

  // ---- FEEDBACK --------------------------------------------------------------
  if (phase === "feedback") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 pb-6">
        <h1 className="font-serif text-xl font-medium">Here&rsquo;s what stands out</h1>
        {traitScores.map((t) => (
          <Card key={t.trait}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold">{TRAIT_LABELS[t.trait]}</h3>
              <Badge variant={t.score >= 3 ? "sage" : "amber"}>{t.score}/4</Badge>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-soft">{t.aiNotesMd}</p>
          </Card>
        ))}
        <Button className="w-full" onClick={() => setPhase("privacy-choice")}>
          Continue
        </Button>
      </main>
    );
  }

  // ---- PRIVACY CHOICE --------------------------------------------------------
  if (phase === "privacy-choice") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 pb-6">
        <h1 className="font-serif text-xl font-medium">What happens to your writing?</h1>
        <Card className="bg-terracotta-soft">
          <p className="text-[13px] leading-relaxed">
            The scores and feedback above are already saved either way. This choice is just about the
            words you wrote — delete them, keep them private to you, or share them with one person you
            name. If you don&rsquo;t decide within 48 hours, it&rsquo;s automatically deleted.
          </p>
        </Card>

        {error && <p className="text-xs font-medium text-amber">{error}</p>}

        <div className="flex flex-col gap-2.5">
          <Button
            variant="secondary"
            className="w-full"
            disabled={decidingBusy !== null}
            onClick={() => handleDecide("private")}
          >
            {decidingBusy === "private" ? "Saving…" : "Keep it private to me"}
          </Button>

          <Card className="flex flex-col gap-2.5">
            <p className="text-[12.5px] font-semibold">Share with someone</p>
            <input
              type="text"
              value={reviewerLabel}
              onChange={(e) => setReviewerLabel(e.target.value)}
              placeholder="Who are you sharing this with? (e.g. Erica)"
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
            />
            <Button
              disabled={decidingBusy !== null || reviewerLabel.trim().length === 0}
              onClick={() => handleDecide("shared")}
            >
              {decidingBusy === "shared" ? "Creating link…" : "Share"}
            </Button>
          </Card>

          <button
            type="button"
            disabled={decidingBusy !== null}
            onClick={() => handleDecide("delete")}
            className="text-xs font-medium text-ink-soft underline decoration-dotted"
          >
            {decidingBusy === "delete" ? "Deleting…" : "Delete this writing permanently"}
          </button>
        </div>
      </main>
    );
  }

  // ---- SHARED LINK -------------------------------------------------------
  if (phase === "shared-link" && shareUrl) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center gap-4 px-1 py-10 text-center">
        <span className="text-4xl">🔗</span>
        <h2 className="font-serif text-xl font-semibold">Share link created</h2>
        <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-ink-soft">
          Send this link to {reviewerLabel}. You can revoke it anytime from Progress.
        </p>
        <Card className="w-full break-all text-left text-[12.5px]">{shareUrl}</Card>
        <Button className="w-full" onClick={() => router.push("/home")}>
          Back to Home
        </Button>
      </main>
    );
  }

  // ---- DONE ---------------------------------------------------------------
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center gap-4 px-1 py-10 text-center">
      <span className="text-4xl">✓</span>
      <h2 className="font-serif text-xl font-semibold">Saved</h2>
      <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-ink-soft">
        Your feedback is saved to your progress either way.
      </p>
      <Button className="w-full" onClick={() => router.push("/home")}>
        Back to Home
      </Button>
    </main>
  );
}
