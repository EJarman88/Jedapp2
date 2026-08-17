import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { requireReportsAccess } from "@/lib/auth/session";

export default async function ReportsPage() {
  const { user, viewerRole, allowed } = await requireReportsAccess();

  return <ReportsDashboard viewerRole={viewerRole} allowed={allowed} displayName={user.displayName} />;
}
