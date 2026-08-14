import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
        <h1 className="mt-2 font-serif text-xl font-medium">Create an account</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          The first account created here becomes the full admin account. Only one more
          account — Reports-only — can ever be created after that.
        </p>
      </div>

      <Card>
        <AuthForm
          action={signUp}
          submitLabel="Create account"
          fields={[
            { name: "display_name", label: "Your name", type: "text", autoComplete: "name" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
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
