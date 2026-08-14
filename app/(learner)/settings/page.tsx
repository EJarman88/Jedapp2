import { Card, CardLabel } from "@/components/ui/card";
import { ThemePicker } from "@/components/theme/theme-picker";

export default function SettingsPage() {
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
    </main>
  );
}
