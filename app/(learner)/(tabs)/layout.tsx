import { TabHeader } from "@/components/layout/tab-header";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { requireStudentOrAdmin } from "@/lib/auth/session";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudentOrAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <TabHeader initial={user.displayName.charAt(0).toUpperCase()} />
      <div className="flex-1 px-6 pb-4">{children}</div>
      <BottomTabBar />
    </div>
  );
}
