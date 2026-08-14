"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4">
      <Link href="/" className="font-serif text-lg font-semibold text-terracotta">
        EdApp
      </Link>
      <nav className="flex gap-5">
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
      </nav>
    </header>
  );
}
