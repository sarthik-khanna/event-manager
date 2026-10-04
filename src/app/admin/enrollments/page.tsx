"use client";

import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Input, Select } from "@/components/ui/input";
import { Alert, Badge, EmptyState, PageHeader, ProgressBar, Skeleton } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th } from "@/components/ui/table";
import { api, ApiClientError, toQuery, type CourseSummary, type EnrollmentDto, type Paginated } from "@/lib/client";
import { useApi, useDebounced } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";

export default function AdminEnrollmentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const courses = useApi<Paginated<CourseSummary>>("/api/courses?status=all&sort=title&limit=50");
  const { data, loading, error, reload } = useApi<Paginated<EnrollmentDto>>(
    `/api/enrollments${toQuery({ q, status, courseId, page, limit: 15 })}`,
  );

  async function remove(e: EnrollmentDto) {
    if (!confirm(`Remove ${e.user.name} from "${e.course.title}"?`)) return;
    try {
      await api(`/api/enrollments/${e.id}`, { method: "DELETE" });
      toast("Enrollment removed");
      reload();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Enrollments" description="Track which students are enrolled where, and how far they've got." />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-500" />
          <Input
            aria-label="Search enrollments"
            placeholder="Search student name, email or course…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select aria-label="Course" value={courseId} onChange={(e) => { setCourseId(e.target.value); setPage(1); }}>
            <option value="">All courses</option>
            {courses.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">In progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && !data ? (
        <Skeleton className="h-96" />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No enrollments found" />
      ) : (
        data && (
          <div className={cn(loading && "opacity-60")}>
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Progress</Th>
                  <Th>Status</Th>
                  <Th>Enrolled</Th>
                  <Th>Last active</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02]">
                    <Td>
                      <p className="font-medium text-white">{e.user.name}</p>
                      <p className="text-xs text-neutral-500">{e.user.email}</p>
                    </Td>
                    <Td className="max-w-56 truncate">{e.course.title}</Td>
                    <Td className="w-44">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={e.progress} />
                        <span className="w-9 text-xs">{e.progress}%</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={e.status === "completed" ? "green" : "cyan"}>{e.status === "completed" ? "Completed" : "In progress"}</Badge>
                    </Td>
                    <Td className="text-neutral-500">{formatDate(e.enrolledAt)}</Td>
                    <Td className="text-neutral-500">{formatDate(e.lastAccessedAt)}</Td>
                    <Td className="text-right">
                      <button onClick={() => remove(e)} title="Remove enrollment" className="cursor-pointer rounded-md p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 className="size-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
          </div>
        )
      )}
    </div>
  );
}
