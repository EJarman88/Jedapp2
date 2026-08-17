"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { GedReadySubject } from "@/lib/supabase/database.types";

/** Admin-only ledger entry: did she pass the real GED exam for this subject, and has
 * the $75 actually been paid out. Two separate flags — passing unlocks the "earned"
 * badge immediately; paid_out tracks the money separately. */
export async function upsertRealTestResult(
  studentUserId: string,
  subject: GedReadySubject,
  passed: boolean,
  paidOut: boolean,
): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("real_test_results")
    .upsert({ user_id: studentUserId, subject, passed, paid_out: paidOut }, { onConflict: "user_id,subject" });

  if (error) return { error: error.message };

  revalidatePath("/reports");
  return {};
}
