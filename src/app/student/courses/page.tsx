"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { EnrollmentCard } from "@/components/enrollment-card";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { toQuery, type EnrollmentDto, type Paginated } from "@/lib/client";
import { useApi, useDebounced } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "", label: "All" },
  { value: "active", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export default function MyCoursesPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, loading, error } = useApi<Paginated<EnrollmentDto>>(`/api/enrollments${toQuery({ q, status, limit: 100 })}`);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="My courses" description="Every course you're enrolled in, with your progress." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit gap-1 rounded-xl border border-white/[0.08] bg-neutral-950 p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={cn(
                "cursor-pointer rounded-lg px-4 py-1.5 text-sm transition",
                status === t.value ? "bg-white text-black" : "text-neutral-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-500" />
          <Input aria-label="Search my courses" placeholder="Search my courses…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          title="No courses match"
          description="Try a different filter, or enroll in something new."
          action={<ButtonLink href="/courses">Browse catalog</ButtonLink>}
        />
      ) : (
        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}>
          {data?.items.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}
