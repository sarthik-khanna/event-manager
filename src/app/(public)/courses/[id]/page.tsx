import { BarChart, BookOpen, Clock, Lock, PlayCircle, User, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CourseThumbnail } from "@/components/course-card";
import { EnrollButton } from "@/components/enroll-button";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { Badge, Card, levelTone, ProgressBar } from "@/components/ui/misc";
import { ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { capitalize } from "@/lib/utils";
import { getCourse } from "@/server/courses";
import { findUserEnrollment } from "@/server/enrollments";

type Props = { params: Promise<{ id: string }> };

// Deduped between generateMetadata and the page render.
const load = cache(async (id: string) => {
  const session = await getSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  try {
    const course = await getCourse(id, session?.role ?? null);
    const enrollment = session?.role === "student" ? await findUserEnrollment(session.sub, id) : null;
    return { course, enrollment, session };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { course } = await load(id);
  return { title: course.title, description: course.description.slice(0, 160) };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const { course, enrollment, session } = await load(id);
  const totalMinutes = course.lessons.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <BackgroundGrid />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px]">
          <div>
            <Link href="/courses" className="text-sm text-neutral-400 hover:text-white">
              &larr; All courses
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="indigo">{course.category}</Badge>
              <Badge tone={levelTone[course.level]}>{course.level}</Badge>
              {!course.isPublished && <Badge tone="amber">Draft</Badge>}
            </div>
            <h1 className="mt-4 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-neutral-300">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
              <span className="flex items-center gap-2"><User className="size-4" /> {course.instructor}</span>
              <span className="flex items-center gap-2"><BookOpen className="size-4" /> {course.lessons.length} lessons</span>
              <span className="flex items-center gap-2"><Clock className="size-4" /> {course.durationHours} hours</span>
              <span className="flex items-center gap-2"><Users className="size-4" /> {course.enrollmentCount} enrolled</span>
              <span className="flex items-center gap-2"><BarChart className="size-4" /> {capitalize(course.level)}</span>
            </div>
          </div>

          <Card className="h-fit overflow-hidden p-0 lg:sticky lg:top-24">
            <CourseThumbnail src={course.thumbnailUrl} title={course.title} />
            <div className="space-y-4 p-5">
              {enrollment && (
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-neutral-400">Your progress</span>
                    <span className="font-medium text-white">{enrollment.progress}%</span>
                  </div>
                  <ProgressBar value={enrollment.progress} />
                </div>
              )}
              <EnrollButton courseId={course.id} role={session?.role ?? null} enrollmentId={enrollment?.id} />
              <p className="text-center text-xs text-neutral-500">Full lifetime access · Track your progress</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="lg:max-w-[calc(100%-420px)]">
          <h2 className="text-2xl font-bold text-white">Course content</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {course.lessons.length} lessons · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total
          </p>
          <ol className="mt-6 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
            {course.lessons.map((lesson, i) => (
              <li key={lesson.id} className="flex items-center gap-4 bg-neutral-950 px-5 py-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm text-neutral-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-100">{lesson.title}</p>
                  <p className="text-xs text-neutral-500">{lesson.durationMinutes} min</p>
                </div>
                {enrollment ? (
                  <PlayCircle className="size-5 text-indigo-400" />
                ) : (
                  <Lock className="size-4 text-neutral-600" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
