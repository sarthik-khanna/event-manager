import { CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { CourseThumbnail } from "@/components/course-card";
import { Badge, ProgressBar } from "@/components/ui/misc";
import type { EnrollmentDto } from "@/lib/client";
import { formatDate } from "@/lib/utils";

export function EnrollmentCard({ enrollment }: { enrollment: EnrollmentDto }) {
  const { course } = enrollment;
  const done = enrollment.status === "completed";
  const lessonsDone = Math.round((enrollment.progress / 100) * course.lessonCount);

  return (
    <Link
      href={`/student/learn/${enrollment.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950 transition hover:-translate-y-1 hover:border-indigo-500/40"
    >
      <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="aspect-[16/7]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge tone="indigo">{course.category}</Badge>
          {done ? (
            <Badge tone="green">
              <CheckCircle2 className="mr-1 size-3" /> Completed
            </Badge>
          ) : (
            <Badge tone="cyan">In progress</Badge>
          )}
        </div>
        <h3 className="line-clamp-2 font-semibold text-white">{course.title}</h3>
        <p className="mt-1 text-xs text-neutral-500">by {course.instructor}</p>
        <div className="mt-auto pt-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-neutral-400">
              {lessonsDone}/{course.lessonCount} lessons
            </span>
            <span className="font-medium text-white">{enrollment.progress}%</span>
          </div>
          <ProgressBar value={enrollment.progress} />
          <p className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
            <Clock className="size-3" /> Last opened {formatDate(enrollment.lastAccessedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
