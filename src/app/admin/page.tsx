"use client";

import { Award, BookOpen, GraduationCap, ListChecks, Plus } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ErrorAlert, Badge, Card, PageHeader, ProgressBar, Skeleton, StatCard } from "@/components/ui/misc";
import { Table, Td, Th } from "@/components/ui/table";
import { useApi } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";

interface Stats {
  totals: {
    students: number;
    admins: number;
    courses: number;
    publishedCourses: number;
    enrollments: number;
    completedEnrollments: number;
    averageProgress: number;
    completionRate: number;
  };
  topCourses: { id: string; title: string; category: string; enrollments: number; averageProgress: number }[];
  byCategory: { category: string; courses: number; enrollments: number }[];
  recentEnrollments: {
    id: string;
    enrolledAt: string;
    progress: number;
    status: "active" | "completed";
    studentName: string;
    courseTitle: string;
  }[];
}

export default function AdminOverview() {
  const { data, loading, error } = useApi<Stats>("/api/admin/stats");
  const maxEnroll = Math.max(1, ...(data?.topCourses.map((c) => c.enrollments) ?? [1]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Admin overview"
        description="Platform activity across courses, students and enrollments."
        actions={
          <ButtonLink href="/admin/courses/new">
            <Plus className="size-4" /> New course
          </ButtonLink>
        }
      />
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Students" value={data.totals.students} hint={`${data.totals.admins} admin(s)`} icon={<GraduationCap className="size-5" />} />
            <StatCard label="Courses" value={data.totals.courses} hint={`${data.totals.publishedCourses} published`} icon={<BookOpen className="size-5" />} />
            <StatCard label="Enrollments" value={data.totals.enrollments} hint={`Avg. progress ${data.totals.averageProgress}%`} icon={<ListChecks className="size-5" />} />
            <StatCard label="Completion rate" value={`${data.totals.completionRate}%`} hint={`${data.totals.completedEnrollments} completed`} icon={<Award className="size-5" />} />
          </>
        )}
      </div>

      {data && (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <h2 className="font-semibold text-white">Top courses by enrollment</h2>
              <div className="mt-5 space-y-4">
                {data.topCourses.map((c) => (
                  <Link key={c.id} href={`/admin/courses/${c.id}/edit`} className="group block">
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="truncate text-neutral-300 group-hover:text-white">{c.title}</span>
                      <span className="shrink-0 text-neutral-500">
                        {c.enrollments} · avg {c.averageProgress}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${(c.enrollments / maxEnroll) * 100}%` }}
                      />
                    </div>
                  </Link>
                ))}
                {data.topCourses.length === 0 && <p className="text-sm text-neutral-500">No courses yet.</p>}
              </div>
            </Card>
            <Card>
              <h2 className="font-semibold text-white">By category</h2>
              <ul className="mt-5 divide-y divide-white/[0.06]">
                {data.byCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-neutral-300">{c.category}</span>
                    <span className="text-neutral-500">
                      {c.courses} course(s) · {c.enrollments} enrolled
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent enrollments</h2>
              <Link href="/admin/enrollments" className="text-sm text-indigo-400 hover:text-indigo-300">
                View all
              </Link>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Progress</Th>
                  <Th>Status</Th>
                  <Th>Enrolled</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentEnrollments.map((e) => (
                  <tr key={e.id}>
                    <Td className="text-white">{e.studentName}</Td>
                    <Td>{e.courseTitle}</Td>
                    <Td className="w-40">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={e.progress} />
                        <span className="w-9 text-xs">{e.progress}%</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={e.status === "completed" ? "green" : "cyan"}>{e.status}</Badge>
                    </Td>
                    <Td className="text-neutral-500">{formatDate(e.enrolledAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
