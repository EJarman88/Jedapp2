import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PracticePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Practice</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          Coming soon — timed practice sets, diagnostics, and remediation.
        </p>
      </Card>
      <Card>
        <p className="mb-3 text-sm leading-relaxed text-ink-soft">
          Ready to practice a full written response? RLA extended response prompts, scored with warm,
          specific feedback.
        </p>
        <Link href="/practice/extended-response">
          <Button className="w-full">Write an Extended Response</Button>
        </Link>
      </Card>
    </main>
  );
}
