"use client";

import { Award, BookOpen, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { EnrollmentCard } from "@/components/enrollment-card";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Card, EmptyState, PageHeader, ProgressBar, Skeleton, StatCard } from "@/components/ui/misc";
import type { EnrollmentDto, Paginated } from "@/lib/client";
import { useApi } from "@/lib/hooks";

export default function StudentDashboard() {
  const { data, loading, error } = useApi<Paginated<EnrollmentDto>>("/api/enrollments?limit=100");
  const items = data?.items ?? [];
  const completed = items.filter((e) => e.status === "completed");
  const inProgress = items.filter((e) => e.status === "active");
  const avg = items.length ? Math.round(items.reduce((s, e) => s + e.progress, 0) / items.length) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Welcome back 👋"
        description="Here's an overview of your learning progress."
        actions={<ButtonLink href="/courses">Browse courses</ButtonLink>}
      />
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Enrolled courses" value={items.length} icon={<BookOpen className="size-5" />} />
            <StatCard label="In progress" value={inProgress.length} icon={<Flame className="size-5" />} />
            <StatCard label="Completed" value={completed.length} icon={<Award className="size-5" />} />
            <StatCard label="Average progress" value={`${avg}%`} icon={<TrendingUp className="size-5" />} />
          </>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Continue learning</h2>
            <Link href="/student/courses" className="text-sm text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>
          {loading && !data ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : inProgress.length === 0 ? (
            <EmptyState
              title={items.length ? "All caught up!" : "No courses yet"}
              description={items.length ? "You've completed every course you enrolled in." : "Enroll in a course to start tracking your progress."}
              action={<ButtonLink href="/courses">Find a course</ButtonLink>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgress.slice(0, 4).map((e) => (
                <EnrollmentCard key={e.id} enrollment={e} />
              ))}
            </div>
          )}
        </section>

        <aside>
          <h2 className="mb-4 text-lg font-semibold text-white">Progress by course</h2>
          <Card className="space-y-5">
            {loading && !data && <Skeleton className="h-24" />}
            {!loading && items.length === 0 && <p className="text-sm text-neutral-500">Nothing to show yet.</p>}
            {items.map((e) => (
              <Link key={e.id} href={`/student/learn/${e.id}`} className="block">
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="truncate text-neutral-300">{e.course.title}</span>
                  <span className="shrink-0 text-neutral-400">{e.progress}%</span>
                </div>
                <ProgressBar value={e.progress} />
              </Link>
            ))}
          </Card>
        </aside>
      </div>
    </div>
  );
}
