import { Nav } from "@/components/layout/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
