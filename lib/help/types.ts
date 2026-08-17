import type { HelpMessageRole, HelpSessionStatus, HelpSubject } from "@/lib/supabase/database.types";

export interface HelpMessageView {
  id: string;
  role: HelpMessageRole;
  content: string;
  createdAt: string;
}

export interface HelpProblemView {
  id: string;
  extractedText: string;
  solved: boolean;
  orderIndex: number;
  sourceImageUrl: string | null;
  messages: HelpMessageView[];
}

export interface HelpSessionView {
  id: string;
  subject: HelpSubject;
  status: HelpSessionStatus;
  startedAt: string;
  problems: HelpProblemView[];
}
