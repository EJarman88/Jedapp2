import Link from "next/link";

export function TabHeader({ initial }: { initial: string }) {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="font-serif text-lg font-semibold text-terracotta">EdApp</span>
      <Link
        href="/settings"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta-soft text-sm font-semibold text-terracotta"
      >
        {initial}
      </Link>
    </header>
  );
}
