import type { PrivacyStatus, Trait } from "@/lib/supabase/database.types";

export interface TraitScoreView {
  trait: Trait;
  score: number;
  aiNotesMd: string;
}

export interface ReviewerLinkView {
  id: string;
  token: string;
  reviewerLabel: string;
  revoked: boolean;
  viewedAt: string | null;
}

export interface ExtendedResponseView {
  id: string;
  promptId: string;
  promptTitle: string;
  submittedAt: string;
  privacyStatus: PrivacyStatus;
  traitScores: TraitScoreView[];
  reviewerLink: ReviewerLinkView | null;
}
