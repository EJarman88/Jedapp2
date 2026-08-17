import { requireStudentOrAdmin } from "@/lib/auth/session";
import { PracticeFlow } from "@/components/practice/practice-flow";

export default async function PracticePage() {
  await requireStudentOrAdmin();
  return <PracticeFlow />;
}
