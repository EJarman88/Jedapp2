import { Card } from "@/components/ui/card";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { listGedReadyScores } from "@/lib/practice/ged-ready";
import { GedReadyForm } from "@/components/practice/ged-ready-form";
import { listExtendedResponses } from "@/lib/extended-response/data";
import { ResponseHistory } from "@/components/extended-response/response-history";

export default async function ProgressPage() {
  const user = await requireStudentOrAdmin();
  const [scores, responses] = await Promise.all([
    listGedReadyScores(user.id),
    listExtendedResponses(user.id),
  ]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Progress</h1>

      <GedReadyForm scores={scores} />

      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          The full reports view — trends, incentive progress, and confidence over time — lands in a
          later phase. GED Ready passing score: 145.
        </p>
      </Card>

      <ResponseHistory responses={responses} />
    </main>
  );
}
