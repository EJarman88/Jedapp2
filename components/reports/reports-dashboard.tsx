import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { SubjectScoreCards } from "./subject-score-cards";
import { IncentiveProgress } from "./incentive-progress";
import { WeeklyDigest } from "./weekly-digest";
import { TraitTrends } from "./trait-trends";
import { ConfidenceChart } from "./confidence-chart";
import {
  getConfidenceVsActual,
  getIncentiveProgress,
  getStudentUserId,
  getSubjectScoreCards,
  getTraitTrends,
} from "@/lib/reports/data";
import { generateWeeklyDigest } from "@/lib/reports/digest";
import type { ReportsViewerRole } from "@/lib/auth/session";

function notAvailableCopy(viewerRole: ReportsViewerRole): string {
  if (viewerRole === "admin") {
    return "Reports access isn’t currently available. Jalisa controls this from her own Settings — the parent access toggle, available once she’s 18 — so there’s nothing to do on your end.";
  }
  return "Reports access isn’t currently available. Jalisa can turn this on for you anytime from her Settings — nothing you need to do on your end.";
}

/**
 * The one shared Reports dashboard, parameterized by viewer role (student, admin,
 * restricted_reports) rather than three separate implementations. Never queries or
 * renders raw extended-response text under any role — that stays in Phase 6's
 * separate Progress/ResponseHistory + reviewer-link flow.
 */
export async function ReportsDashboard({
  viewerRole,
  allowed,
  displayName,
}: {
  viewerRole: ReportsViewerRole;
  allowed: boolean;
  displayName: string;
}) {
  if (!allowed) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="font-serif text-2xl font-medium">Reports</h1>
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">{notAvailableCopy(viewerRole)}</p>
        </Card>
      </main>
    );
  }

  const studentUserId = await getStudentUserId();
  if (!studentUserId) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="font-serif text-2xl font-medium">Reports</h1>
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">No student account exists yet.</p>
        </Card>
      </main>
    );
  }

  const [scoreCards, incentiveProgress, traitTrends, confidence, digest] = await Promise.all([
    getSubjectScoreCards(studentUserId),
    getIncentiveProgress(studentUserId),
    getTraitTrends(studentUserId),
    getConfidenceVsActual(studentUserId),
    generateWeeklyDigest(studentUserId),
  ]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex items-center gap-3">
        {viewerRole === "student" && (
          <Link href="/home" className="text-lg text-ink-soft">
            ←
          </Link>
        )}
        <div>
          <h1 className="font-serif text-2xl font-medium">Reports</h1>
          <p className="mt-1 text-sm text-ink-soft">Welcome, {displayName}</p>
        </div>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">📊 Subject scores</CardLabel>
        <SubjectScoreCards cards={scoreCards} />
      </div>

      <Card>
        <IncentiveProgress data={incentiveProgress} editable={viewerRole === "admin"} studentUserId={studentUserId} />
      </Card>

      <Card>
        <WeeklyDigest sentences={digest} />
      </Card>

      <Card>
        <TraitTrends data={traitTrends} />
      </Card>

      <Card>
        <ConfidenceChart data={confidence} />
      </Card>
    </main>
  );
}
