import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const [{ data: studentAvailable }, { data: restrictedAvailable }] = await Promise.all([
    supabase.rpc("student_signup_available"),
    supabase.rpc("restricted_signup_available"),
  ]);

  const roleOptions = [
    ...(studentAvailable ? [{ value: "student", label: "Student" }] : []),
    ...(restrictedAvailable ? [{ value: "restricted_reports", label: "Reports only" }] : []),
  ];

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
        <h1 className="mt-2 font-serif text-xl font-medium">Create your account</h1>
      </div>

      <Card>
        {roleOptions.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            All the account slots for this app are already taken.
          </p>
        ) : (
          <AuthForm
            action={signUp}
            submitLabel="Create account"
            fields={[
              { name: "display_name", label: "Your name", type: "text", autoComplete: "name" },
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              {
                name: "password",
                label: "6-digit PIN",
                type: "password",
                autoComplete: "new-password",
                inputMode: "numeric",
                pattern: "\\d{6}",
                maxLength: 6,
              },
              { name: "requested_role", label: "Account type", type: "select", options: roleOptions },
              {
                name: "date_of_birth",
                label: "Date of birth (students only)",
                type: "date",
                required: false,
              },
            ]}
          />
        )}
      </Card>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-terracotta">
          Log in
        </Link>
      </p>
    </main>
  );
}
