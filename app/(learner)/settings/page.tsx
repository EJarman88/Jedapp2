import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { ReportsAccessCard } from "@/components/settings/reports-access-card";
import { ParentAccessCard } from "@/components/settings/parent-access-card";
import { listAccounts } from "@/lib/auth/accounts";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdult } from "@/lib/utils";

const ROLE_LABEL = {
  admin: "Admin",
  student: "Student",
  restricted_reports: "Reports only",
} as const;

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Settings</h1>

      <AppearanceSection />

      {user.role === "student" && <StudentPrivacySection userId={user.id} />}

      {user.role === "admin" && <AdminAccountSections />}
    </main>
  );
}

async function StudentPrivacySection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("date_of_birth, parent_access_enabled")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const eligible = isAdult(profile.date_of_birth);

  return (
    <div>
      <CardLabel className="mb-2 mt-0">Parent access</CardLabel>
      <Card>
        {eligible ? (
          <ParentAccessCard initialEnabled={profile.parent_access_enabled} />
        ) : (
          <p className="text-sm leading-relaxed text-ink-soft">
            Once you turn 18, you&rsquo;ll be able to control whether a parent or
            guardian can see your reports here.
          </p>
        )}
      </Card>
    </div>
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
