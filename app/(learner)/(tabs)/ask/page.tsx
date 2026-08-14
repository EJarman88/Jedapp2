import { Card } from "@/components/ui/card";

export default function AskPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Ask Me (Almost) Anything</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          Coming soon — upload a problem for tracked, Socratic guidance, or start a
          separate, unmonitored conversation with Claude.
        </p>
      </Card>
    </main>
  );
}
