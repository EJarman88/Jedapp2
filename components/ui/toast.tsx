"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  show: boolean;
  message: string;
  onDismiss: () => void;
  /** ms before auto-dismiss. */
  duration?: number;
}

export function Toast({ show, message, onDismiss, duration = 2200 }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background shadow-lg transition-all duration-200",
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {message}
    </div>
  );
}
