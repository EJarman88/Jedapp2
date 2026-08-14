"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ displayName }: { displayName?: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4">
      <Link href="/" className="font-serif text-lg font-semibold text-terracotta">
        EdApp
      </Link>
      <nav className="flex items-center gap-5">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors",
              pathname === link.href ? "text-terracotta" : "text-ink-soft hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        ))}
        {displayName && (
          <span className="hidden text-sm text-ink-soft sm:inline">Hi, {displayName}</span>
        )}
        <form action={signOut}>
          <button type="submit" className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
