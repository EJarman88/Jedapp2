import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login");
  if (user.role === "restricted_reports") redirect("/reports");
  if (user.role === "admin") redirect("/settings");
  redirect("/home");
}
