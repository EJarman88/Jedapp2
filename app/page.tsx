import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
      <h1 className="max-w-sm font-serif text-3xl font-medium">Your GED prep, at your pace</h1>
      <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
        A calm, focused place to work toward your GED — one subject at a time.
      </p>
      <Link
        href="/home"
        className="inline-flex items-center justify-center rounded-xl bg-terracotta px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Go to Home
      </Link>
    </main>
  );
}
