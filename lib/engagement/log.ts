import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { EngagementEventType } from "@/lib/supabase/database.types";

/**
 * Metadata-only behavioral log (CLAUDE.md rule #4). Every call site already has a
 * student-scoped supabase client and knows its own user id — this is just the shared
 * insert shape. No field here may ever encode an inferred emotional/mental state.
 */
export async function logEngagementEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventType: EngagementEventType,
  options?: { contextType?: string; contextId?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  await supabase.from("engagement_events").insert({
    user_id: userId,
    event_type: eventType,
    context_type: options?.contextType ?? null,
    context_id: options?.contextId ?? null,
    metadata: options?.metadata ?? {},
  });
}
