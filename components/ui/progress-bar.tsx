import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export function ProgressBar({ value, className, trackClassName, fillClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("h-2 flex-1 overflow-hidden rounded-full bg-line/60", trackClassName, className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-terracotta transition-[width] duration-300 ease-out", fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
