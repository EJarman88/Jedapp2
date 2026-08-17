import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSignedHelpPhotoUrl } from "./storage";
import type { HelpMessageView, HelpSessionView } from "./types";

export const DAILY_SESSION_CAP = 5;

function todayStartUtcIso(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export async function countTodaysHelpSessions(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("help_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", todayStartUtcIso());

  return count ?? 0;
}

export async function getHelpSession(sessionId: string, userId: string): Promise<HelpSessionView | null> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("help_sessions")
    .select("id, subject, status, started_at, user_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== userId) return null;

  const { data: problems } = await supabase
    .from("help_problems")
    .select("id, source_image_path, extracted_text, order_index, solved")
    .eq("session_id", sessionId)
    .order("order_index");

  const problemViews = await Promise.all(
    (problems ?? []).map(async (p) => ({
      id: p.id,
      extractedText: p.extracted_text,
      solved: p.solved,
      orderIndex: p.order_index,
      sourceImageUrl: p.source_image_path ? await getSignedHelpPhotoUrl(p.source_image_path) : null,
      messages: await getProblemMessages(p.id),
    })),
  );

  return {
    id: session.id,
    subject: session.subject,
    status: session.status,
    startedAt: session.started_at,
    problems: problemViews,
  };
}

export async function getProblemMessages(problemId: string): Promise<HelpMessageView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("help_messages")
    .select("id, role, content, created_at")
    .eq("problem_id", problemId)
    .order("created_at");

  return (data ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }));
}
