import "server-only";

import { createClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

/**
 * A plain-language, behavior-only weekly summary — deterministic sentence templates
 * over structured counts, not an LLM call, so there's nothing here that could ever
 * speculate about emotional state (CLAUDE.md rule #4). Draws on practice_sessions,
 * agenda_items, extended_responses, and engagement_events (Phase 9).
 */
export async function generateWeeklyDigest(studentUserId: string): Promise<string[]> {
  const supabase = await createClient();
  const thisWeekStart = daysAgoIso(7);
  const lastWeekStart = daysAgoIso(14);

  const [
    { data: sessionsThisWeek },
    { data: sessionsLastWeek },
    { data: agendaThisWeek },
    { data: responsesThisWeek },
    { data: eventsThisWeek },
  ] = await Promise.all([
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
    supabase
      .from("engagement_events")
      .select("event_type, metadata")
      .eq("user_id", studentUserId)
      .gte("created_at", thisWeekStart),
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
  for (const item of agendaThisWeek ?? []) {
    if (!item.subject || item.status !== "done") continue;
    doneBySubject.set(item.subject, (doneBySubject.get(item.subject) ?? 0) + 1);
  }

  const steadySubjects = [...doneBySubject.entries()].filter(([, count]) => count >= 2).map(([s]) => s);
  if (steadySubjects.length > 0) {
    sentences.push(`Consistent, steady engagement in ${steadySubjects.join(" and ")}.`);
  }

  // item_avoided fires once, in lib/agenda/data.ts, the moment an item crosses the
  // 3-carryover threshold — so counting events here (not recomputing from
  // agenda_items) is the single source of truth for this signal.
  const avoidedSubjects = [
    ...new Set(
      (eventsThisWeek ?? [])
        .filter((e) => e.event_type === "item_avoided")
        .map((e) => (e.metadata as { subject?: string })?.subject)
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  for (const subject of avoidedSubjects) {
    sentences.push(`${subject} items carried over a few times this week — may be worth a check-in.`);
  }

  const hintSkippedCount = (eventsThisWeek ?? []).filter((e) => e.event_type === "hint_skipped").length;
  if (hintSkippedCount >= 2) {
    sentences.push(
      "Asked for the direct answer a few times during Ask Me (Almost) Anything — the guidance redirected each time, same as always.",
    );
  }

  const fastCompletionCount = (eventsThisWeek ?? []).filter((e) => e.event_type === "fast_completion").length;
  if (fastCompletionCount > 0) {
    sentences.push(
      `${fastCompletionCount} practice set${fastCompletionCount === 1 ? "" : "s"} finished much faster than her usual pace — worth a quick look together.`,
    );
  }

  const patternFlagCount = (eventsThisWeek ?? []).filter((e) => e.event_type === "answer_pattern_flag").length;
  if (patternFlagCount > 0) {
    sentences.push(
      `${patternFlagCount} practice set${patternFlagCount === 1 ? "" : "s"} showed a same-answer pattern worth a second look.`,
    );
  }

  const pasteCount = (eventsThisWeek ?? []).filter((e) => e.event_type === "paste_detected").length;
  if (pasteCount > 0) {
    sentences.push(
      `Pasted text showed up in ${pasteCount} Ask Me (Almost) Anything message${pasteCount === 1 ? "" : "s"} this week.`,
    );
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
