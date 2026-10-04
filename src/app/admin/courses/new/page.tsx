import type { Metadata } from "next";
import { CourseForm } from "@/components/course-form";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "New course" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Create course" description="Add course details and build out its lessons." />
      <CourseForm />
    </div>
  );
}
