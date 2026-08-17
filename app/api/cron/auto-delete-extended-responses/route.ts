import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Scheduled by vercel.json's crons entry. Finds extended_responses still in the
 * 'pending' holding state past their auto_delete_at, and deletes raw_text the same
 * way a manual delete does — actually removed, not just flagged. trait_scores are
 * untouched (a different table, cascade-only on the response row itself).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: expired, error: selectError } = await supabase
    .from("extended_responses")
    .select("id")
    .eq("privacy_status", "pending")
    .lt("auto_delete_at", nowIso);

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const ids = (expired ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await supabase
      .from("extended_responses")
      .update({ raw_text: null, privacy_status: "deleted", privacy_decided_at: nowIso })
      .in("id", ids);
  }

  return NextResponse.json({ deleted: ids.length });
}
