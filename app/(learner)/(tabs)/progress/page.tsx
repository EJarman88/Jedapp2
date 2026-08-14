import { Card } from "@/components/ui/card";

export default function ProgressPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Progress</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          Coming soon — your subject scores, trends, and reports.
        </p>
      </Card>
    </main>
  );
}
