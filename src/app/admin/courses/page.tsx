"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CourseFilters, type CourseFilterValues } from "@/components/course-filters";
import { useToast } from "@/components/toast";
import { ButtonLink } from "@/components/ui/button";
import { ErrorAlert, Badge, EmptyState, levelTone, PageHeader, Skeleton } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th } from "@/components/ui/table";
import { api, ApiClientError, toQuery, type CourseSummary, type Paginated } from "@/lib/client";
import { useApi, useDebounced } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";

export default function AdminCoursesPage() {
  const toast = useToast();
  const [filters, setFilters] = useState<CourseFilterValues>({ q: "", category: "", level: "", sort: "newest", status: "" });
  const [page, setPage] = useState(1);
  const q = useDebounced(filters.q);
  const { data, loading, error, reload } = useApi<Paginated<CourseSummary>>(
    `/api/courses${toQuery({ ...filters, q, status: filters.status || "all", page, limit: 10 })}`,
  );

  async function togglePublish(course: CourseSummary) {
    try {
      await api(`/api/courses/${course.id}`, { method: "PATCH", json: { isPublished: !course.isPublished } });
      toast(course.isPublished ? "Course moved to drafts" : "Course published");
      reload();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Update failed", "error");
    }
  }

  async function remove(course: CourseSummary) {
    if (!confirm(`Delete "${course.title}"? This also removes its lessons and ${course.enrollmentCount} enrollment(s).`)) return;
    try {
      await api(`/api/courses/${course.id}`, { method: "DELETE" });
      toast("Course deleted");
      reload();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Courses"
        description="Create, edit, publish and remove courses."
        actions={
          <ButtonLink href="/admin/courses/new">
            <Plus className="size-4" /> New course
          </ButtonLink>
        }
      />
      <CourseFilters
        showStatus
        values={filters}
        onChange={(patch) => {
          setFilters((f) => ({ ...f, ...patch }));
          setPage(1);
        }}
      />

      <div className="mt-6">
        {error && <ErrorAlert>{error}</ErrorAlert>}
        {loading && !data ? (
          <Skeleton className="h-96" />
        ) : data?.items.length === 0 ? (
          <EmptyState title="No courses found" action={<ButtonLink href="/admin/courses/new">Create a course</ButtonLink>} />
        ) : (
          data && (
            <div className={cn(loading && "opacity-60")}>
              <Table>
                <thead>
                  <tr>
                    <Th>Course</Th>
                    <Th>Level</Th>
                    <Th>Lessons</Th>
                    <Th>Enrolled</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <Td>
                        <p className="max-w-xs truncate font-medium text-white">{c.title}</p>
                        <p className="text-xs text-neutral-500">{c.category} · {c.instructor}</p>
                      </Td>
                      <Td>
                        <Badge tone={levelTone[c.level]}>{c.level}</Badge>
                      </Td>
                      <Td>{c.lessonCount}</Td>
                      <Td>{c.enrollmentCount}</Td>
                      <Td>
                        <button
                          onClick={() => togglePublish(c)}
                          title={c.isPublished ? "Click to unpublish (hide from students)" : "Click to publish (show to students)"}
                          className="group/status flex cursor-pointer flex-col items-start gap-1"
                        >
                          <Badge tone={c.isPublished ? "green" : "amber"}>{c.isPublished ? "Published" : "Draft"}</Badge>
                          <span className="text-[11px] text-neutral-500 underline-offset-2 group-hover/status:text-neutral-200 group-hover/status:underline">
                            {c.isPublished ? "Unpublish" : "Publish now"}
                          </span>
                        </button>
                      </Td>
                      <Td className="text-neutral-500">{formatDate(c.updatedAt)}</Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <Link href={`/courses/${c.id}`} className="rounded-md p-2 text-neutral-400 hover:bg-white/5 hover:text-white" title="View">
                            <Eye className="size-4" />
                          </Link>
                          <Link href={`/admin/courses/${c.id}/edit`} className="rounded-md p-2 text-neutral-400 hover:bg-white/5 hover:text-white" title="Edit">
                            <Pencil className="size-4" />
                          </Link>
                          <button onClick={() => remove(c)} className="cursor-pointer rounded-md p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400" title="Delete">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
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
    </div>
  );
}
