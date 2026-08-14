"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Lessons", icon: "📘" },
  { href: "/ask", label: "Ask", icon: "💬" },
  { href: "/practice", label: "Practice", icon: "📊" },
  { href: "/progress", label: "Progress", icon: "💛" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 flex justify-around border-t border-line bg-card px-2 pb-6 pt-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium",
              active ? "font-semibold text-terracotta" : "text-ink-soft",
            )}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
