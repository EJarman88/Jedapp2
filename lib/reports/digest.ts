import "server-only";

import { createClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

/**
 * A plain-language, behavior-only weekly summary — deterministic sentence templates
 * over structured counts, not an LLM call, so there's nothing here that could ever
 * speculate about emotional state (CLAUDE.md rule #4). Currently draws on
 * practice_sessions, agenda_items, and extended_responses; Phase 9's richer
 * avoidance-signal tracking will give this more to say later without changing this
 * function's shape.
 */
export async function generateWeeklyDigest(studentUserId: string): Promise<string[]> {
  const supabase = await createClient();
  const thisWeekStart = daysAgoIso(7);
  const lastWeekStart = daysAgoIso(14);

  const [{ data: sessionsThisWeek }, { data: sessionsLastWeek }, { data: agendaThisWeek }, { data: responsesThisWeek }] =
    await Promise.all([
      supabase
        .from("practice_sessions")
        .select("id")
        .eq("user_id", studentUserId)
        .gte("started_at", thisWeekStart),
      supabase
        .from("practice_sessions")
        .select("id")
        .eq("user_id", studentUserId)
        .gte("started_at", lastWeekStart)
        .lt("started_at", thisWeekStart),
      supabase
        .from("agenda_items")
        .select("subject, status")
        .eq("user_id", studentUserId)
        .gte("scheduled_date", thisWeekStart.slice(0, 10)),
      supabase
        .from("extended_responses")
        .select("privacy_status")
        .eq("user_id", studentUserId)
        .gte("submitted_at", thisWeekStart),
    ]);

  const sentences: string[] = [];

  const thisCount = sessionsThisWeek?.length ?? 0;
  const lastCount = sessionsLastWeek?.length ?? 0;
  if (thisCount > 0 || lastCount > 0) {
    sentences.push(
      lastCount === 0
        ? `${thisCount} practice session${thisCount === 1 ? "" : "s"} this week.`
        : `${thisCount} practice session${thisCount === 1 ? "" : "s"} this week, ${
            thisCount > lastCount ? "up from" : thisCount < lastCount ? "down from" : "the same as"
          } ${lastCount} last week.`,
    );
  }

  const doneBySubject = new Map<string, number>();
  const pendingBySubject = new Map<string, number>();
  for (const item of agendaThisWeek ?? []) {
    if (!item.subject) continue;
    const map = item.status === "done" ? doneBySubject : pendingBySubject;
    map.set(item.subject, (map.get(item.subject) ?? 0) + 1);
  }

  const steadySubjects = [...doneBySubject.entries()].filter(([, count]) => count >= 2).map(([s]) => s);
  if (steadySubjects.length > 0) {
    sentences.push(`Consistent, steady engagement in ${steadySubjects.join(" and ")}.`);
  }

  const worthACheckIn = [...pendingBySubject.entries()]
    .filter(([subject, count]) => count >= 2 && !doneBySubject.has(subject))
    .map(([s]) => s);
  for (const subject of worthACheckIn) {
    sentences.push(`${subject} items carried over a few times this week — may be worth a check-in.`);
  }

  const responseCount = responsesThisWeek?.length ?? 0;
  if (responseCount > 0) {
    const shared = (responsesThisWeek ?? []).filter((r) => r.privacy_status === "shared").length;
    const detail =
      responseCount === 1
        ? (responsesThisWeek ?? [])[0].privacy_status === "shared"
          ? "and chose to share it"
          : "and chose to keep it private"
        : shared > 0
          ? `${shared} shared, the rest kept private`
          : "kept private";
    sentences.push(`Completed ${responseCount} extended response${responseCount === 1 ? "" : "s"} this week — ${detail}.`);
  }

  if (sentences.length === 0) {
    sentences.push("No activity logged this week yet.");
  }

  return sentences;
}
