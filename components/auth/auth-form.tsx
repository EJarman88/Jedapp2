"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/lib/auth/form-state";

interface Field {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "email";
  pattern?: string;
  maxLength?: number;
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface AuthFormProps {
  action: (state: AuthFormState | undefined, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
}

const inputClassName =
  "rounded-xl border border-line bg-background px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-terracotta";

export function AuthForm({ action, fields, submitLabel }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{field.label}</span>
          {field.type === "select" ? (
            <select
              name={field.name}
              required={field.required ?? true}
              defaultValue={field.options?.[0]?.value}
              className={inputClassName}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              pattern={field.pattern}
              maxLength={field.maxLength}
              required={field.required ?? true}
              className={inputClassName}
            />
          )}
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
