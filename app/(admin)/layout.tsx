import { signOut } from "@/lib/auth/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="font-serif text-lg font-semibold text-terracotta">EdApp</span>
        <form action={signOut}>
          <button type="submit" className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">
            Sign out
          </button>
        </form>
      </header>
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
