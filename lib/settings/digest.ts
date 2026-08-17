import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface DigestSubscriptionView {
  granteeUserId: string;
  displayName: string;
  enabled: boolean;
}

/** Student-only: every restricted_reports account's digest toggle state, keyed off
 * household_members_for_student() since digest_subscriptions itself has no display name. */
export async function listDigestSubscriptionsForStudent(
  restrictedMembers: { id: string; displayName: string }[],
): Promise<DigestSubscriptionView[]> {
  if (restrictedMembers.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("digest_subscriptions")
    .select("user_id, enabled")
    .in(
      "user_id",
      restrictedMembers.map((m) => m.id),
    );

  const enabledByUser = new Map((data ?? []).map((d) => [d.user_id, d.enabled]));

  return restrictedMembers.map((m) => ({
    granteeUserId: m.id,
    displayName: m.displayName,
    enabled: enabledByUser.get(m.id) ?? false,
  }));
}
