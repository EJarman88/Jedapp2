import { Nav } from "@/components/layout/nav";
import { requireFullAccess } from "@/lib/auth/session";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireFullAccess();

  return (
    <div className="flex flex-1 flex-col">
      <Nav displayName={user.displayName} />
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
