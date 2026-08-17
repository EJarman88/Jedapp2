import { Card, CardLabel } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getExtendedResponsePromptById } from "@/content/extended-response";

function NotAvailable() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 px-6 py-10">
      <h1 className="font-serif text-2xl font-medium">This isn&rsquo;t available anymore</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          This link has been revoked, or it never existed. If you think that&rsquo;s a mistake, check with
          whoever shared it with you.
        </p>
      </Card>
    </main>
  );
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Anonymous visitor holding an unguessable link — no auth.uid() for RLS to key off,
  // so this goes through the service-role client and does its own authorization here:
  // an unrevoked link for a response that's still actually shared, nothing else.
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("reviewer_links")
    .select("id, response_id, reviewer_label, viewed_at")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (!link) return <NotAvailable />;

  const { data: response } = await supabase
    .from("extended_responses")
    .select("prompt_id, raw_text, privacy_status")
    .eq("id", link.response_id)
    .single();

  if (!response || response.privacy_status !== "shared" || !response.raw_text) {
    return <NotAvailable />;
  }

  if (!link.viewed_at) {
    await supabase
      .from("reviewer_links")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", link.id);
  }

  const prompt = getExtendedResponsePromptById(response.prompt_id);

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 px-6 py-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
          Shared with you by Jalisa
        </p>
        <h1 className="mt-1 font-serif text-xl font-medium">{prompt?.title ?? "Extended response"}</h1>
      </div>

      {prompt && (
        <Card className="text-[13px] leading-relaxed text-ink-soft">
          <CardLabel className="mt-0">{prompt.instructions}</CardLabel>
          <div className="flex flex-col gap-3">
            {prompt.passages.map((p) => (
              <div key={p.label}>
                <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-soft">
                  {p.label}
                </p>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardLabel className="mt-0">Her response</CardLabel>
        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{response.raw_text}</p>
      </Card>

      <p className="text-xs text-ink-soft">
        This link can be revoked by Jalisa at any time — if it stops working, that&rsquo;s why.
      </p>
    </main>
  );
}
