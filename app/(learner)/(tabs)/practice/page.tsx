import { Card } from "@/components/ui/card";

export default function PracticePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Practice</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          Coming soon — timed practice sets, diagnostics, and remediation.
        </p>
      </Card>
    </main>
  );
}
