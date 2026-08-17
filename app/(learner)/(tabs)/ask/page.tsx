import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { StartSessionForm } from "@/components/help/start-session-form";

export default async function AskPage() {
  await requireStudentOrAdmin();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Ask Me (Almost) Anything</h1>

      <StartSessionForm />

      <div>
        <CardLabel className="mt-0">Somewhere else to go</CardLabel>
        <Card>
          <p className="mb-3 text-sm leading-relaxed text-ink-soft">
            Talk to Claude — a separate conversation, outside EdApp. Nothing here is tracked or saved to
            your progress.
          </p>
          <Link href="/ask/talk-to-claude">
            <Button variant="secondary" className="w-full">
              💬 Talk to Claude
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
