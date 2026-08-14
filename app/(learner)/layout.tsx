import { Nav } from "@/components/layout/nav";
import { requireAdmin } from "@/lib/auth/session";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <Nav displayName={user.displayName} />
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
