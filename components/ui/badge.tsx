import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "sage" | "amber" | "terracotta" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  sage: "bg-sage-soft text-ink",
  amber: "bg-amber-soft text-ink",
  terracotta: "bg-terracotta-soft text-terracotta",
  neutral: "border border-line bg-card text-ink-soft",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
