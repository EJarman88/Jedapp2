"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/lib/auth/actions";

interface Field {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
}

interface AuthFormProps {
  action: (state: AuthFormState | undefined, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
}

export function AuthForm({ action, fields, submitLabel }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{field.label}</span>
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            className="rounded-xl border border-line bg-background px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-terracotta"
          />
        </label>
      ))}

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-terracotta">
          {state.error}
        </p>
      )}
      {state?.info && (
        <p role="status" className="text-sm font-medium text-ink-soft">
          {state.info}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Please wait…" : submitLabel}
      </Button>
    </form>
  );
}
