"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPin() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setStatus(error ? "error" : "sent");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-sm font-medium text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        Forgot your PIN?
      </button>
    );
  }

  if (status === "sent") {
    return (
      <p className="text-center text-sm text-ink-soft">
        Check your email for a link to set a new PIN.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-line bg-background px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-terracotta"
        />
      </label>
      {status === "error" && (
        <p className="text-sm font-medium text-terracotta">
          Couldn&rsquo;t send that — try again in a moment.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="text-sm font-medium text-terracotta disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
