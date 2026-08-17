import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { ReportsAccessCard } from "@/components/settings/reports-access-card";
import { ParentAccessCard } from "@/components/settings/parent-access-card";
import { DigestSubscriptionRow } from "@/components/settings/digest-subscription-row";
import { SupportCard } from "@/components/settings/support-card";
import { listAccounts } from "@/lib/auth/accounts";
import { getHouseholdMembersForStudent } from "@/lib/settings/household";
import { listDigestSubscriptionsForStudent } from "@/lib/settings/digest";
import { getSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isAdult } from "@/lib/utils";
import type { PlanStyle } from "@/lib/supabase/database.types";

const ROLE_LABEL = {
  admin: "Admin",
  student: "Student",
  restricted_reports: "Reports only",
} as const;

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const planStyle: PlanStyle = user.planStyle ?? "suggested";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-6 py-8">
      <div className="flex items-center gap-3">
        {user.role === "student" && (
          <Link href="/home" className="text-lg text-ink-soft">
            ←
          </Link>
        )}
        <h1 className="font-serif text-2xl font-medium">Settings</h1>
      </div>

      <AppearanceSection initialPlanStyle={planStyle} />

      {user.role === "student" && <StudentSections userId={user.id} />}

      {user.role === "admin" && <AdminAccountSections />}

      <form action={signOut}>
        <button
          type="submit"
          className="mt-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

async function StudentSections({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: profile }, householdMembers] = await Promise.all([
    supabase.from("users").select("date_of_birth, parent_access_enabled").eq("id", userId).single(),
    getHouseholdMembersForStudent(),
  ]);

  if (!profile) return null;

  const eligible = isAdult(profile.date_of_birth);
  const admin = householdMembers.find((m) => m.role === "admin");
  const restrictedMembers = householdMembers.filter((m) => m.role === "restricted_reports");
  const digestSubscriptions = await listDigestSubscriptionsForStudent(restrictedMembers);

  return (
    <>
      <div>
        <CardLabel className="mb-2 mt-0">Who can see your reports</CardLabel>
        <Card>
          {!eligible ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              Once you turn 18, you&rsquo;ll be able to control whether a parent or
              guardian can see your reports here.
            </p>
          ) : admin ? (
            <ParentAccessCard adminDisplayName={admin.displayName} initialEnabled={profile.parent_access_enabled} />
          ) : (
            <p className="text-sm text-ink-soft">No admin account exists yet.</p>
          )}
        </Card>
      </div>

      {digestSubscriptions.length > 0 && (
        <div>
          <CardLabel className="mb-2 mt-0">Weekly digest</CardLabel>
          <Card className="flex flex-col gap-0 p-0">
            {digestSubscriptions.map((d, i) => (
              <div key={d.granteeUserId} className={i > 0 ? "border-t border-line" : undefined}>
                <DigestSubscriptionRow
                  granteeUserId={d.granteeUserId}
                  displayName={d.displayName}
                  initialEnabled={d.enabled}
                />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <CardLabel className="mb-2 mt-0">Your own reports</CardLabel>
        <Card>
          <Link href="/reports" className="flex items-center justify-between text-sm font-medium">
            <span>
              📊 View my Reports
              <span className="mt-0.5 block text-xs font-normal text-ink-soft">
                Same data your reviewers see, from your side
              </span>
            </span>
            <span className="shrink-0 text-ink-soft">›</span>
          </Link>
        </Card>
      </div>

      <SupportCard />
    </>
  );
}

async function AdminAccountSections() {
  const accounts = await listAccounts();
  const restrictedAccounts = accounts.filter((a) => a.role === "restricted_reports");

  return (
    <>
      <div>
        <CardLabel className="mb-2 mt-0">Who can see reports</CardLabel>
        <Card className="flex flex-col gap-5">
          {restrictedAccounts.length > 0 ? (
            restrictedAccounts.map((account) => (
              <ReportsAccessCard
                key={account.id}
                granteeUserId={account.id}
                displayName={account.displayName}
                initialStatus={account.grantStatus ?? "inert"}
              />
            ))
          ) : (
            <p className="text-sm text-ink-soft">
              No one has created a reports-only account yet.
            </p>
          )}
        </Card>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">Reports</CardLabel>
        <Card>
          <Link href="/reports" className="flex items-center justify-between text-sm font-medium">
            <span>
              View reports
              <span className="mt-0.5 block text-xs font-normal text-ink-soft">
                Only visible when Jalisa has turned on parent access from her own Settings.
              </span>
            </span>
            <span className="shrink-0 text-ink-soft">›</span>
          </Link>
        </Card>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">Preview</CardLabel>
        <Card>
          <Link href="/home" className="flex items-center justify-between text-sm font-medium">
            <span>
              Preview as student
              <span className="mt-0.5 block text-xs font-normal text-ink-soft">
                See the real lesson/agenda experience under your own account — a
                separate agenda and progress from hers, so nothing here touches her data.
              </span>
            </span>
            <span className="shrink-0 text-ink-soft">›</span>
          </Link>
        </Card>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">Curriculum</CardLabel>
        <Card>
          <Link href="/videos" className="flex items-center justify-between text-sm font-medium">
            Curated videos
            <span className="text-ink-soft">›</span>
          </Link>
        </Card>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">Accounts</CardLabel>
        <Card className="flex flex-col gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{account.displayName}</p>
                <p className="text-xs text-ink-soft">{account.email}</p>
              </div>
              <Badge variant="neutral">{ROLE_LABEL[account.role]}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
