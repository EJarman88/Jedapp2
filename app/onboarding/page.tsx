import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireStudent } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const user = await requireStudent();

  if (user.planStyle) redirect("/home");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-terracotta">EdApp</p>
      </div>

      <Card>
        <OnboardingWizard />
      </Card>
    </main>
  );
}
