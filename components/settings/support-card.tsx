import { Card, CardLabel } from "@/components/ui/card";

// Name only ever renders as text — CLAUDE.md Phase 9: never an email or phone number
// as visible content. The actual contact method lives only in the href attribute,
// read from an env var so it's never committed to source control.
const SUPPORT_CONTACT_NAME = process.env.SUPPORT_CONTACT_NAME || "Erica";
const SUPPORT_CONTACT_HREF = process.env.SUPPORT_CONTACT_HREF;

export function SupportCard() {
  return (
    <div>
      <CardLabel className="mb-2 mt-0">Support</CardLabel>
      <Card className="flex items-center gap-3.5 bg-gradient-to-br from-terracotta-soft/40 to-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-lg">
          💬
        </span>
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold">Need help with anything?</p>
          <p className="mt-0.5 text-[11.5px] text-ink-soft">Reach out to {SUPPORT_CONTACT_NAME}</p>
        </div>
        {SUPPORT_CONTACT_HREF ? (
          <a
            href={SUPPORT_CONTACT_HREF}
            className="shrink-0 rounded-xl bg-terracotta px-4 py-2.5 text-xs font-semibold text-white"
          >
            Contact
          </a>
        ) : (
          <span className="shrink-0 text-[11px] text-ink-soft">Not set up yet</span>
        )}
      </Card>
    </div>
  );
}
