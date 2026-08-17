import { notFound } from "next/navigation";
import { requireStudentOrAdmin } from "@/lib/auth/session";
import { getHelpSession } from "@/lib/help/data";
import { SessionView } from "@/components/help/session-view";

export default async function HelpSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStudentOrAdmin();

  const session = await getHelpSession(id, user.id);
  if (!session) notFound();

  return <SessionView session={session} />;
}
