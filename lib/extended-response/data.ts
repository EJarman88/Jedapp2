import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getExtendedResponsePromptById } from "@/content/extended-response";
import type { ExtendedResponseView } from "./types";

/** Every extended response the student has submitted, most recent first, with
 * trait scores and reviewer-link status attached — the "her own view" the
 * privacy-decision and revoke actions operate through. */
export async function listExtendedResponses(userId: string): Promise<ExtendedResponseView[]> {
  const supabase = await createClient();

  const { data: responses } = await supabase
    .from("extended_responses")
    .select("id, prompt_id, submitted_at, privacy_status")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  if (!responses || responses.length === 0) return [];

  const responseIds = responses.map((r) => r.id);

  const [{ data: traitRows }, { data: linkRows }] = await Promise.all([
    supabase
      .from("trait_scores")
      .select("response_id, trait, score, ai_notes_md")
      .in("response_id", responseIds),
    supabase
      .from("reviewer_links")
      .select("id, response_id, token, reviewer_label, revoked_at, viewed_at")
      .in("response_id", responseIds),
  ]);

  return responses.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    promptTitle: getExtendedResponsePromptById(r.prompt_id)?.title ?? "Extended response",
    submittedAt: r.submitted_at,
    privacyStatus: r.privacy_status,
    traitScores: (traitRows ?? [])
      .filter((t) => t.response_id === r.id)
      .map((t) => ({ trait: t.trait, score: t.score, aiNotesMd: t.ai_notes_md })),
    reviewerLink: (() => {
      const link = (linkRows ?? []).find((l) => l.response_id === r.id);
      if (!link) return null;
      return {
        id: link.id,
        token: link.token,
        reviewerLabel: link.reviewer_label,
        revoked: link.revoked_at !== null,
        viewedAt: link.viewed_at,
      };
    })(),
  }));
}

export async function listUsedPromptIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("extended_responses").select("prompt_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.prompt_id);
}
