import { BookOpen, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CourseSummary } from "@/lib/client";
import { Badge, levelTone } from "./ui/misc";

export function CourseThumbnail({ src, title, className }: { src: string | null; title: string; className?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-neutral-900 ${className ?? ""}`}>
      {src ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-600/40 via-neutral-900 to-cyan-500/30 text-4xl font-black text-white/70">
          {title
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </div>
      )}
    </div>
  );
}

export function CourseCard({ course, href }: { course: CourseSummary; href?: string }) {
  return (
    <Link
      href={href ?? `/courses/${course.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      <CourseThumbnail src={course.thumbnailUrl} title={course.title} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="indigo">{course.category}</Badge>
          <Badge tone={levelTone[course.level]}>{course.level}</Badge>
          {!course.isPublished && <Badge tone="amber">Draft</Badge>}
        </div>
        <h3 className="line-clamp-2 font-semibold text-white">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{course.description}</p>
        <p className="mt-3 text-xs text-neutral-500">by {course.instructor}</p>
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" /> {course.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {course.durationHours}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {course.enrollmentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
