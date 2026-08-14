import { redirect } from "next/navigation";
import { requireFullAccess } from "@/lib/auth/session";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireFullAccess();

  if (user.role === "student" && !user.planStyle) {
    redirect("/onboarding");
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}
