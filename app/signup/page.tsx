import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: adminExists } = await supabase.rpc("admin_account_exists");

  if (adminExists) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
        <div className="text-center">
          <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
          <h1 className="mt-2 font-serif text-xl font-medium">Signup is closed</h1>
        </div>
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">
            The admin account already exists. Any other account is created by the
            admin, from Settings — not through this page.
          </p>
        </Card>
        <p className="text-center text-sm text-ink-soft">
          <Link href="/login" className="font-semibold text-terracotta">
            Log in instead
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
        <h1 className="mt-2 font-serif text-xl font-medium">Create your account</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          This one-time setup creates the full admin account. Any other account gets
          created by you, later, from Settings.
        </p>
      </div>

      <Card>
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
          ]}
        />
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
