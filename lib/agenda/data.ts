import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AgendaItemType, AgendaStatus, PlanStyle } from "@/lib/supabase/database.types";
import { logEngagementEvent } from "@/lib/engagement/log";

// An item carried over this many times without being started gets a soft
// "item_avoided" flag for the weekly digest — fired once, at the moment it crosses
// the threshold, not recomputed from scratch every day (CLAUDE.md rule #4: behavior
// only, never a guess at why).
const AVOIDANCE_CARRYOVER_THRESHOLD = 3;

export interface AgendaItemView {
  id: string;
  title: string;
  subtitle: string | null;
  subject: string | null;
  itemType: AgendaItemType;
  status: AgendaStatus;
  isCarryover: boolean;
  locked: boolean;
  contentSlug: string | null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Phase 4/5 will generate real agenda items from the curriculum/practice engines —
// this seeds a first mock batch so the display/completion/carryover mechanics here
// are testable on their own, per the Phase 3 spec.
const SEED_ITEMS = [
  {
    title: "Claims & Evidence lesson",
    subtitle: "Reading Comprehension",
    subject: "RLA",
    item_type: "lesson" as const,
    content_slug: "rla-claims-evidence",
    order_index: 0,
  },
  {
    title: "Timed practice set",
    subtitle: "5 questions · mixed subjects",
    subject: null,
    item_type: "practice" as const,
    content_slug: null,
    order_index: 1,
  },
  {
    title: "Math: Linear equations",
    subtitle: "Not started",
    subject: "Math",
    item_type: "lesson" as const,
    content_slug: "math-linear-equations",
    order_index: 2,
  },
];

/**
 * Rolls forward any still-pending items from earlier days onto today — automatic
 * carryover, no manual step (CLAUDE.md Phase 3) — seeds a first mock batch on a
 * brand-new account, then returns today's list with plan_style lock/carryover flags
 * computed for display.
 */
export async function getTodayAgenda(userId: string, planStyle: PlanStyle): Promise<AgendaItemView[]> {
  const supabase = await createClient();
  const today = todayISO();

  const { data: stale } = await supabase
    .from("agenda_items")
    .select("id, scheduled_date, carried_over_from, carryover_count, subject")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lt("scheduled_date", today);

  for (const item of stale ?? []) {
    const nextCarryoverCount = item.carryover_count + 1;
    await supabase
      .from("agenda_items")
      .update({
        scheduled_date: today,
        carried_over_from: item.carried_over_from ?? item.scheduled_date,
        carryover_count: nextCarryoverCount,
      })
      .eq("id", item.id);

    if (nextCarryoverCount === AVOIDANCE_CARRYOVER_THRESHOLD) {
      await logEngagementEvent(supabase, userId, "item_avoided", {
        contextType: "agenda_item",
        contextId: item.id,
        metadata: { subject: item.subject },
      });
    }
  }

  const { count } = await supabase
    .from("agenda_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!count) {
    await supabase
      .from("agenda_items")
      .insert(SEED_ITEMS.map((item) => ({ ...item, user_id: userId, scheduled_date: today })));
  }

  const { data: items } = await supabase
    .from("agenda_items")
    .select("id, title, subtitle, subject, item_type, status, carried_over_from, content_slug")
    .eq("user_id", userId)
    .eq("scheduled_date", today)
    .order("order_index");

  let sawPending = false;

  return (items ?? []).map((item) => {
    const locked = planStyle === "fixed" && sawPending;
    if (item.status === "pending") sawPending = true;

    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      subject: item.subject,
      itemType: item.item_type,
      status: item.status,
      isCarryover: item.carried_over_from !== null,
      locked,
      contentSlug: item.content_slug,
    };
  });
}
