import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
        <h1 className="mt-2 font-serif text-xl font-medium">Welcome back</h1>
      </div>

      <Card>
        <AuthForm
          action={signIn}
          submitLabel="Log in"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            {
              name: "password",
              label: "6-digit PIN",
              type: "password",
              autoComplete: "current-password",
              inputMode: "numeric",
              pattern: "\\d{6}",
              maxLength: 6,
            },
          ]}
        />
      </Card>

      <p className="text-center text-sm text-ink-soft">
        Setting up for the first time?{" "}
        <Link href="/signup" className="font-semibold text-terracotta">
          Create an account
        </Link>
      </p>
    </main>
  );
}
