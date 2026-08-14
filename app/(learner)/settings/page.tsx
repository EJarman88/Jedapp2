import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemePicker } from "@/components/theme/theme-picker";
import { listAccounts } from "@/lib/auth/accounts";
import type { GrantStatus } from "@/lib/supabase/database.types";

const GRANT_BADGE: Record<GrantStatus, { label: string; variant: "sage" | "amber" | "neutral" }> = {
  active: { label: "Active", variant: "sage" },
  inert: { label: "Not yet active", variant: "amber" },
  revoked: { label: "Revoked", variant: "neutral" },
};

export default async function SettingsPage() {
  const accounts = await listAccounts();

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
        <CardLabel className="mb-2 mt-0">Accounts</CardLabel>
        <Card className="flex flex-col gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{account.displayName}</p>
                <p className="text-xs text-ink-soft">{account.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{account.role === "admin" ? "Admin" : "Reports only"}</Badge>
                {account.grantStatus && (
                  <Badge variant={GRANT_BADGE[account.grantStatus].variant}>
                    {GRANT_BADGE[account.grantStatus].label}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
