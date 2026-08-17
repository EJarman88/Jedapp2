"use server";

import { revalidatePath } from "next/cache";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { HelpSubject } from "@/lib/supabase/database.types";
import { extractProblemsFromImages } from "@/lib/claude/extract-problems-from-images";
import { transcribeHandwriting } from "@/lib/claude/transcribe-handwriting";
import { getSocraticReply, type SocraticMessage } from "@/lib/claude/socratic-reply";
import { getTalkToClaudeReply, type TalkToClaudeMessage } from "@/lib/claude/talk-to-claude";
import { uploadHelpPhoto } from "./storage";
import { countTodaysHelpSessions, DAILY_SESSION_CAP, getProblemMessages } from "./data";
import { logEngagementEvent } from "@/lib/engagement/log";

// A pasted chunk shorter than this is just a word or two — not worth flagging.
const PASTE_LENGTH_THRESHOLD = 30;
// Simple phrasing match for "just give me the answer" style requests — the Socratic
// tutor (Phase 7) is built to never answer directly regardless, so this is a soft
// behavioral note, not a gate on anything.
const DIRECT_ANSWER_REQUEST_PATTERN = /\b(just tell me|give me the answer|what'?s the answer|skip to the answer)\b/i;

export interface StartHelpSessionResult {
  sessionId?: string;
  capped?: boolean;
}

/** Starts a session from photo(s), typed text, or both. Session cap is a kind
 * message, not a hard error — the caller decides how to show it. */
export async function startHelpSession(
  subject: HelpSubject,
  imageDataUrls: string[],
  typedProblemText?: string,
): Promise<StartHelpSessionResult> {
  const user = await requireStudentOrAdmin();

  if ((await countTodaysHelpSessions(user.id)) >= DAILY_SESSION_CAP) {
    return { capped: true };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("help_sessions")
    .insert({ user_id: user.id, subject })
    .select("id")
    .single();

  if (error || !session) throw new Error(error?.message ?? "Could not start a session.");

  let firstImagePath: string | null = null;
  let problemTexts: string[] = [];

  if (imageDataUrls.length > 0) {
    const uploadedPaths = await Promise.all(
      imageDataUrls.map((url, i) => uploadHelpPhoto(user.id, session.id, `photo-${i}.jpg`, url)),
    );
    firstImagePath = uploadedPaths[0] ?? null;
    problemTexts = await extractProblemsFromImages(imageDataUrls);
  }

  if (problemTexts.length === 0 && typedProblemText?.trim()) {
    problemTexts = [typedProblemText.trim()];
    firstImagePath = null;
  }

  if (problemTexts.length === 0) {
    throw new Error("Couldn't find a problem to work on — try a clearer photo or type it in.");
  }

  await supabase.from("help_problems").insert(
    problemTexts.map((text, i) => ({
      session_id: session.id,
      extracted_text: text,
      source_image_path: firstImagePath,
      order_index: i,
    })),
  );

  revalidatePath("/ask");
  return { sessionId: session.id };
}

export async function sendHelpMessage(
  problemId: string,
  subject: string,
  problemText: string,
  userText: string,
  wasPasted = false,
): Promise<string> {
  const user = await requireStudentOrAdmin();
  const supabase = await createClient();

  const priorMessages = await getProblemMessages(problemId);
  await supabase.from("help_messages").insert({ problem_id: problemId, role: "user", content: userText });

  if (wasPasted && userText.trim().length > PASTE_LENGTH_THRESHOLD) {
    await logEngagementEvent(supabase, user.id, "paste_detected", {
      contextType: "help_problem",
      contextId: problemId,
    });
  }
  if (DIRECT_ANSWER_REQUEST_PATTERN.test(userText)) {
    await logEngagementEvent(supabase, user.id, "hint_skipped", {
      contextType: "help_problem",
      contextId: problemId,
    });
  }

  const history: SocraticMessage[] = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userText },
  ];
  const reply = await getSocraticReply(subject, problemText, history);

  await supabase.from("help_messages").insert({ problem_id: problemId, role: "assistant", content: reply });
  return reply;
}

export async function transcribeCanvas(imageDataUrl: string): Promise<string> {
  await requireStudentOrAdmin();
  return transcribeHandwriting(imageDataUrl);
}

export async function markProblemSolved(problemId: string): Promise<void> {
  await requireStudentOrAdmin();
  const supabase = await createClient();
  await supabase.from("help_problems").update({ solved: true }).eq("id", problemId);
  revalidatePath("/ask");
}

export async function completeHelpSession(sessionId: string): Promise<void> {
  await requireStudentOrAdmin();
  const supabase = await createClient();
  await supabase
    .from("help_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  revalidatePath("/ask");
}

/** Feature B — never touches an EdApp table, intentionally. */
export async function sendTalkToClaudeMessage(history: TalkToClaudeMessage[]): Promise<string> {
  await requireStudentOrAdmin();
  return getTalkToClaudeReply(history);
}
