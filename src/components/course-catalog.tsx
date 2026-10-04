"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { CourseFilters, type CourseFilterValues } from "@/components/course-filters";
import { Alert, EmptyState, Skeleton } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { toQuery, type CourseSummary, type Paginated } from "@/lib/client";
import { useApi, useDebounced } from "@/lib/hooks";

/** Public course catalog. Filters are mirrored into the URL so results are shareable. */
export function CourseCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [filters, setFilters] = useState<CourseFilterValues>({
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    level: params.get("level") ?? "",
    sort: params.get("sort") ?? "newest",
  });
  const [page, setPage] = useState(Number(params.get("page")) || 1);
  const q = useDebounced(filters.q);

  const query = toQuery({ q, category: filters.category, level: filters.level, sort: filters.sort, page, status: "published" });
  const { data, loading, error } = useApi<Paginated<CourseSummary>>(`/api/courses${query}&limit=9`);

  useEffect(() => {
    const qs = toQuery({ q, category: filters.category, level: filters.level, sort: filters.sort === "newest" ? "" : filters.sort, page: page > 1 ? page : "" });
    router.replace(`${pathname}${qs}`, { scroll: false });
  }, [q, filters.category, filters.level, filters.sort, page, pathname, router]);

  return (
    <div>
      <CourseFilters
        values={filters}
        onChange={(patch) => {
          setFilters((f) => ({ ...f, ...patch }));
          setPage(1);
        }}
      />

      <div className="mt-8">
        {error && <Alert>{error}</Alert>}
        {loading && !data ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          <EmptyState title="No courses found" description="Try a different search term or clear the filters." />
        ) : (
          data && (
            <div className={loading ? "opacity-60 transition" : "transition"}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
