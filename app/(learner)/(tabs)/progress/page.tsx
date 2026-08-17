import { Card } from "@/components/ui/card";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { listExtendedResponses } from "@/lib/extended-response/data";
import { ResponseHistory } from "@/components/extended-response/response-history";

export default async function ProgressPage() {
  const user = await requireStudentOrAdmin();
  const responses = await listExtendedResponses(user.id);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Progress</h1>
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">
          Coming soon — your subject scores and trends.
        </p>
      </Card>
      <ResponseHistory responses={responses} />
    </main>
  );
}
