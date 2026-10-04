import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { PageHeader } from "@/components/ui/misc";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/session";
import type { CourseDetail } from "@/lib/client";
import { getCourse } from "@/server/courses";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin"); // pages render in parallel with layouts, so guard here too
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let course: CourseDetail;
  try {
    // Serialise Dates so the client form receives plain JSON like the REST API returns.
    course = JSON.parse(JSON.stringify(await getCourse(id, "admin")));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit course" description={course.title} />
      <CourseForm course={course} />
    </div>
  );
}
