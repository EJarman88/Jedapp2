import { Card, CardLabel } from "@/components/ui/card";
import { requireRestrictedReports } from "@/lib/auth/session";

export default async function ReportsPage() {
  const { user, grantStatus } = await requireRestrictedReports();

  if (grantStatus !== "active") {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="font-serif text-2xl font-medium">Reports</h1>
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">
            Reports access isn&rsquo;t currently available. Jalisa can turn this on for
            you anytime from her Settings — nothing you need to do on your end.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="font-serif text-2xl font-medium">Reports</h1>
        <p className="mt-1 text-sm text-ink-soft">Welcome, {user.displayName}</p>
      </div>

      <Card>
        <CardLabel>Reports-only access</CardLabel>
        <p className="text-sm leading-relaxed text-ink-soft">
          The full reports dashboard (subject scores, incentive progress, weekly
          digest) lands in a later phase. This confirms your access is active and
          scoped to reports only — no lessons, no Ask Me (Almost) Anything.
        </p>
      </Card>
    </main>
  );
}
