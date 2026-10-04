import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseCatalog } from "@/components/course-catalog";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader title="Explore courses" description="Search the catalog and filter by category, level or popularity." />
      <Suspense>
        <CourseCatalog />
      </Suspense>
    </div>
  );
}
