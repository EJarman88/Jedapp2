import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemePicker } from "@/components/theme/theme-picker";
import { ReportsAccessCard } from "@/components/settings/reports-access-card";
import { AuthForm } from "@/components/auth/auth-form";
import { listAccounts } from "@/lib/auth/accounts";
import { inviteRestrictedAccount } from "@/lib/auth/invite";

export default async function SettingsPage() {
  const accounts = await listAccounts();
  const restrictedAccount = accounts.find((a) => a.role === "restricted_reports");

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Settings</h1>

      <div>
        <CardLabel className="mb-2 mt-0">Appearance</CardLabel>
        <Card>
          <p className="mb-1 text-sm font-medium">Background theme</p>
          <p className="mb-4 text-xs text-ink-soft">
            Pick whatever feels easiest to read. You can change this anytime.
          </p>
          <ThemePicker />
        </Card>
      </div>

      <div>
        <CardLabel className="mb-2 mt-0">Who can see your reports</CardLabel>
        <Card>
          {restrictedAccount ? (
            <ReportsAccessCard
              granteeUserId={restrictedAccount.id}
              displayName={restrictedAccount.displayName}
              initialStatus={restrictedAccount.grantStatus ?? "inert"}
            />
          ) : (
            <div>
              <p className="mb-4 text-xs leading-relaxed text-ink-soft">
                Create dad&rsquo;s account below — he&rsquo;ll log in with the email and
                PIN you set here. His reports access starts off; you can turn it on
                anytime after.
              </p>
              <AuthForm
                action={inviteRestrictedAccount}
                submitLabel="Create account"
                fields={[
                  { name: "display_name", label: "His name", type: "text", autoComplete: "name" },
                  { name: "email", label: "His email", type: "email", autoComplete: "email" },
                  {
                    name: "pin",
                    label: "6-digit PIN",
                    type: "password",
                    autoComplete: "new-password",
                    inputMode: "numeric",
                    pattern: "\\d{6}",
                    maxLength: 6,
                  },
                ]}
              />
            </div>
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
              <Badge variant="neutral">{account.role === "admin" ? "Admin" : "Reports only"}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
