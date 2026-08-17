import { requireStudentOrAdmin } from "@/lib/auth/session";
import { TalkToClaudeChat } from "@/components/help/talk-to-claude-chat";

export default async function TalkToClaudePage() {
  await requireStudentOrAdmin();
  return <TalkToClaudeChat />;
}
