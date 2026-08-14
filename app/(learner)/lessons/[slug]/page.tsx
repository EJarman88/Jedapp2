import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { getLessonBySlug } from "@/content/lessons";
import { getVideoForSkillTag } from "@/lib/content/curated-videos";
import { getOrStartLessonProgress } from "@/lib/content/lesson-progress";
import { LessonScreen } from "@/components/lessons/lesson-screen";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireStudent();

  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const [video, progress] = await Promise.all([
    getVideoForSkillTag(lesson.skillTag),
    getOrStartLessonProgress(user.id, lesson.id),
  ]);

  return <LessonScreen lesson={lesson} video={video} initialStatus={progress.status} />;
}
