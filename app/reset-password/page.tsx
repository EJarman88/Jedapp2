"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PIN_PATTERN = /^\d{6}$/;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!PIN_PATTERN.test(pin)) {
      setError("PIN needs to be exactly 6 digits.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: pin });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
        <h1 className="mt-2 font-serif text-xl font-medium">Set a new PIN</h1>
      </div>

      <Card>
        {!ready ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            Open this page from the reset link in your email — it isn&rsquo;t usable on
            its own.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">New 6-digit PIN</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="new-password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="rounded-xl border border-line bg-background px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-terracotta"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium text-terracotta">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "Saving…" : "Save PIN"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
