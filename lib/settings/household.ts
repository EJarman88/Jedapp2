import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

export interface HouseholdMember {
  id: string;
  role: UserRole;
  displayName: string;
}

/** Student-only: the admin + any restricted_reports accounts' display names, via the
 * household_members_for_student() RPC (migration 0011) — never the full users row. */
export async function getHouseholdMembersForStudent(): Promise<HouseholdMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("household_members_for_student");

  return (data ?? []).map((m) => ({ id: m.id, role: m.role, displayName: m.display_name }));
}
