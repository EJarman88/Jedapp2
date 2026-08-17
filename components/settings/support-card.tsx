import { Card, CardLabel } from "@/components/ui/card";

// Deliberately no phone number or email anywhere here — not as visible text, not as a
// tel:/mailto: href, not in an env var. The project owner's call: Erica isn't hard to
// reach in real life, and no contact detail should be embeddable in the app's DOM at
// all (a href is still readable via view-source, even when never rendered as text).
const SUPPORT_CONTACT_NAME = "Erica";

export function SupportCard() {
  return (
    <div>
      <CardLabel className="mb-2 mt-0">Support</CardLabel>
      <Card className="flex items-center gap-3.5 bg-gradient-to-br from-terracotta-soft/40 to-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-lg">
          💬
        </span>
        <div>
          <p className="text-[13.5px] font-semibold">Need help with anything?</p>
          <p className="mt-0.5 text-[11.5px] text-ink-soft">
            Reach out to {SUPPORT_CONTACT_NAME} — she&rsquo;ll know how to find you.
          </p>
        </div>
      </Card>
    </div>
  );
}
