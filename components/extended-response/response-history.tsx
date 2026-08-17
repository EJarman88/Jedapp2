"use client";

import { useState, useTransition } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  decideExtendedResponsePrivacy,
  revokeReviewerLink,
  type PrivacyDecision,
} from "@/lib/extended-response/actions";
import type { ExtendedResponseView } from "@/lib/extended-response/types";
import type { PrivacyStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<PrivacyStatus, string> = {
  pending: "Awaiting your decision",
  deleted: "Deleted",
  private: "Private",
  shared: "Shared",
};

function PendingDecision({ response }: { response: ExtendedResponseView }) {
  const [isPending, startTransition] = useTransition();
  const [reviewerLabel, setReviewerLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<PrivacyDecision | null>(null);
  const [done, setDone] = useState(false);

  function decide(decision: PrivacyDecision) {
    setError(null);
    setBusy(decision);
    startTransition(async () => {
      const result = await decideExtendedResponsePrivacy(
        response.id,
        decision,
        decision === "shared" ? reviewerLabel : undefined,
      );
      setBusy(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return <p className="mt-2 text-xs font-medium text-sage">Saved.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <p className="text-xs text-ink-soft">
        This is still in its 48-hour holding window — decide what happens to the writing.
      </p>
      {error && <p className="text-xs font-medium text-amber">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={isPending} onClick={() => decide("private")}>
          {busy === "private" ? "Saving…" : "Keep private"}
        </Button>
        <Button
          variant="secondary"
          disabled={isPending}
          className="text-amber"
          onClick={() => decide("delete")}
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={reviewerLabel}
          onChange={(e) => setReviewerLabel(e.target.value)}
          placeholder="Share with (name)"
          className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-xs"
        />
        <Button
          disabled={isPending || reviewerLabel.trim().length === 0}
          onClick={() => decide("shared")}
        >
          {busy === "shared" ? "Sharing…" : "Share"}
        </Button>
      </div>
    </div>
  );
}

function ShareControls({ response }: { response: ExtendedResponseView }) {
  const [isPending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(response.reviewerLink?.revoked ?? false);
  const link = response.reviewerLink;
  if (!link) return null;

  const url = typeof window !== "undefined" ? `${window.location.origin}/review/${link.token}` : "";

  if (revoked) {
    return <p className="mt-2 text-xs text-ink-soft">Link revoked — {link.reviewerLabel} can no longer view this.</p>;
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs text-ink-soft">
        Shared with {link.reviewerLabel}{link.viewedAt ? " · viewed" : " · not viewed yet"}
      </p>
      <p className="mt-1.5 break-all text-[11px] text-ink-soft">{url}</p>
      <Button
        variant="secondary"
        className="mt-2"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await revokeReviewerLink(link.id);
            setRevoked(true);
          })
        }
      >
        Revoke access
      </Button>
    </div>
  );
}

export function ResponseHistory({ responses }: { responses: ExtendedResponseView[] }) {
  if (responses.length === 0) {
    return (
      <div>
        <CardLabel className="mb-2 mt-0">Extended Responses</CardLabel>
        <Card>
          <p className="text-sm text-ink-soft">Nothing written yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <CardLabel className="mb-2 mt-0">Extended Responses</CardLabel>
      <div className="flex flex-col gap-3">
        {responses.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{r.promptTitle}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {new Date(r.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={r.privacyStatus === "shared" ? "sage" : "neutral"}>
                {STATUS_LABEL[r.privacyStatus]}
              </Badge>
            </div>

            {r.traitScores.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.traitScores.map((t) => (
                  <span
                    key={t.trait}
                    className="rounded-lg bg-line/60 px-2 py-1 text-[10px] font-semibold text-ink-soft"
                  >
                    {t.trait.replace(/_/g, " ")}: {t.score}/4
                  </span>
                ))}
              </div>
            )}

            {r.privacyStatus === "pending" && <PendingDecision response={r} />}
            {r.privacyStatus === "shared" && <ShareControls response={r} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
