import { requireStudentOrAdmin } from "@/lib/auth/session";
import { pickNextPrompt } from "@/content/extended-response";
import { listUsedPromptIds } from "@/lib/extended-response/data";
import { WritingFlow } from "@/components/extended-response/writing-flow";

export default async function ExtendedResponsePage() {
  const user = await requireStudentOrAdmin();
  const usedPromptIds = await listUsedPromptIds(user.id);
  const prompt = pickNextPrompt(usedPromptIds);

  return <WritingFlow prompt={prompt} />;
}
