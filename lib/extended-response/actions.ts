"use server";

import { revalidatePath } from "next/cache";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getExtendedResponsePromptById } from "@/content/extended-response";
import { scoreExtendedResponse } from "@/lib/claude/score-extended-response";
import type { TraitScoreView } from "./types";

export interface SubmitExtendedResponseResult {
  responseId: string;
  traitScores: TraitScoreView[];
}

/**
 * Submits and immediately scores an extended response. Scoring happens in the same
 * request as the write — trait_scores must survive whatever she later decides about
 * raw_text, so it can never depend on a step that comes after this one.
 */
export async function submitExtendedResponse(
  promptId: string,
  rawText: string,
): Promise<SubmitExtendedResponseResult> {
  const user = await requireStudentOrAdmin();
  const prompt = getExtendedResponsePromptById(promptId);
  if (!prompt) throw new Error("That prompt couldn't be found.");
  if (rawText.trim().length === 0) throw new Error("Write a response before submitting.");

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("extended_responses")
    .insert({ user_id: user.id, prompt_id: promptId, raw_text: rawText })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Could not save your response.");

  const scores = await scoreExtendedResponse(prompt, rawText);

  await supabase.from("trait_scores").insert(
    scores.map((s) => ({
      response_id: inserted.id,
      trait: s.trait,
      score: s.score,
      ai_notes_md: s.aiNotesMd,
    })),
  );

  revalidatePath("/progress");

  return {
    responseId: inserted.id,
    traitScores: scores.map((s) => ({ trait: s.trait, score: s.score, aiNotesMd: s.aiNotesMd })),
  };
}

export type PrivacyDecision = "delete" | "private" | "shared";

export interface DecidePrivacyResult {
  shareToken?: string;
  error?: string;
}

/**
 * The one-time privacy choice: delete (raw_text is actually removed from the row,
 * not just flagged), keep private (visible only to her), or share (a one-time
 * reviewer link). trait_scores are never touched by this — they persist regardless.
 */
export async function decideExtendedResponsePrivacy(
  responseId: string,
  decision: PrivacyDecision,
  reviewerLabel?: string,
): Promise<DecidePrivacyResult> {
  const user = await requireStudentOrAdmin();
  const supabase = await createClient();

  const { data: response } = await supabase
    .from("extended_responses")
    .select("id, user_id")
    .eq("id", responseId)
    .single();

  if (!response || response.user_id !== user.id) {
    return { error: "That response couldn't be found." };
  }

  if (decision === "delete") {
    await supabase
      .from("extended_responses")
      .update({ raw_text: null, privacy_status: "deleted", privacy_decided_at: new Date().toISOString() })
      .eq("id", responseId);
    revalidatePath("/progress");
    return {};
  }

  if (decision === "private") {
    await supabase
      .from("extended_responses")
      .update({ privacy_status: "private", privacy_decided_at: new Date().toISOString() })
      .eq("id", responseId);
    revalidatePath("/progress");
    return {};
  }

  // decision === "shared"
  const label = reviewerLabel?.trim();
  if (!label) return { error: "Enter a name for who you're sharing this with." };

  await supabase
    .from("extended_responses")
    .update({ privacy_status: "shared", privacy_decided_at: new Date().toISOString() })
    .eq("id", responseId);

  const { data: link, error } = await supabase
    .from("reviewer_links")
    .insert({ response_id: responseId, reviewer_label: label })
    .select("token")
    .single();

  if (error || !link) return { error: error?.message ?? "Could not create the share link." };

  revalidatePath("/progress");
  return { shareToken: link.token };
}

/** Revokes a shared reviewer link — enforced at the RLS layer too (the review page's
 * query requires revoked_at IS NULL), so this takes effect immediately even mid-view. */
export async function revokeReviewerLink(linkId: string): Promise<void> {
  await requireStudentOrAdmin();
  const supabase = await createClient();

  await supabase
    .from("reviewer_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId);

  revalidatePath("/progress");
}
