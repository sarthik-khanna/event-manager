"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, ProgressBar, Skeleton } from "@/components/ui/misc";
import { api, ApiClientError, type EnrollmentDetail } from "@/lib/client";
import { useApi } from "@/lib/hooks";
import { cn } from "@/lib/utils";

function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data, setData, loading, error } = useApi<EnrollmentDetail>(`/api/enrollments/${id}`);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading && !data) {
    return (
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Alert>{error ?? "Enrollment not found"}</Alert>
        <ButtonLink href="/student/courses" variant="secondary">Back to my courses</ButtonLink>
      </div>
    );
  }

  const completed = new Set(data.completedLessonIds);
  const firstIncomplete = data.lessons.find((l) => !completed.has(l.id));
  const index = Math.max(0, data.lessons.findIndex((l) => l.id === (currentId ?? firstIncomplete?.id ?? data.lessons[0]?.id)));
  const lesson = data.lessons[index];
  const isDone = lesson ? completed.has(lesson.id) : false;
  const embed = lesson?.videoUrl ? youtubeEmbed(lesson.videoUrl) : null;

  async function toggle(lessonId: string, done: boolean, advance = false) {
    setSaving(true);
    try {
      const updated = await api<EnrollmentDetail>(`/api/enrollments/${id}/progress`, {
        method: "PATCH",
        json: { lessonId, completed: done },
      });
      setData(updated);
      if (updated.status === "completed" && data!.status !== "completed") toast("🎉 Course completed! Great work.");
      if (advance && index < data!.lessons.length - 1) setCurrentId(data!.lessons[index + 1].id);
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Could not save progress", "error");
    } finally {
      setSaving(false);
    }
  }

  async function unenroll() {
    if (!confirm(`Leave "${data!.course.title}"? Your progress will be lost.`)) return;
    try {
      await api(`/api/enrollments/${id}`, { method: "DELETE" });
      toast("You have left the course");
      router.push("/student/courses");
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Could not unenroll", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href="/student/courses" className="text-sm text-neutral-400 hover:text-white">
            &larr; My courses
          </Link>
          <h1 className="mt-2 truncate text-2xl font-bold text-white">{data.course.title}</h1>
          <p className="text-sm text-neutral-500">by {data.course.instructor}</p>
        </div>
        <div className="w-full sm:w-72">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-400">
              {completed.size}/{data.lessons.length} lessons
            </span>
            <span className="font-medium text-white">{data.progress}%</span>
          </div>
          <ProgressBar value={data.progress} />
        </div>
      </div>

      {data.status === "completed" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
          <Trophy className="size-6 shrink-0" />
          <p className="text-sm">You completed this course. You can still revisit any lesson.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit p-2 lg:sticky lg:top-8">
          <p className="px-3 pt-2 pb-3 text-xs tracking-widest text-neutral-500 uppercase">Lessons</p>
          <ol className="max-h-[60vh] space-y-1 overflow-y-auto">
            {data.lessons.map((l, i) => (
              <li key={l.id}>
                <button
                  onClick={() => setCurrentId(l.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    i === index ? "bg-white/[0.08] text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                  )}
                >
                  {completed.has(l.id) ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-neutral-600" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {i + 1}. {l.title}
                  </span>
                  <span className="text-xs text-neutral-600">{l.durationMinutes}m</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-2 border-t border-white/[0.06] p-2">
            <button onClick={unenroll} className="cursor-pointer text-xs text-neutral-500 hover:text-red-400">
              Unenroll from course
            </button>
          </div>
        </Card>

        {lesson && (
          <Card className="p-0">
            {embed && (
              <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
                <iframe
                  src={embed}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Lesson {index + 1} of {data.lessons.length}</Badge>
                <Badge>{lesson.durationMinutes} min</Badge>
                {isDone && <Badge tone="green">Completed</Badge>}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">{lesson.title}</h2>
              <div className="mt-4 leading-relaxed whitespace-pre-line text-neutral-300">{lesson.content}</div>
              {lesson.videoUrl && !embed && (
                <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                  Open lesson resource <ExternalLink className="size-4" />
                </a>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={index === 0} onClick={() => setCurrentId(data.lessons[index - 1].id)}>
                    <ArrowLeft className="size-4" /> Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={index === data.lessons.length - 1}
                    onClick={() => setCurrentId(data.lessons[index + 1].id)}
                  >
                    Next <ArrowRight className="size-4" />
                  </Button>
                </div>
                {isDone ? (
                  <Button variant="ghost" loading={saving} onClick={() => toggle(lesson.id, false)}>
                    Mark as incomplete
                  </Button>
                ) : (
                  <Button loading={saving} onClick={() => toggle(lesson.id, true, true)}>
                    <CheckCircle2 className="size-4" /> Mark complete{index < data.lessons.length - 1 ? " & continue" : ""}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
