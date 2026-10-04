"use client";

import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { capitalize, COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/utils";

export interface CourseFilterValues {
  q: string;
  category: string;
  level: string;
  sort: string;
  status?: string;
}

export function CourseFilters({
  values,
  onChange,
  showStatus,
}: {
  values: CourseFilterValues;
  onChange: (patch: Partial<CourseFilterValues>) => void;
  showStatus?: boolean;
}) {
  const active = values.q || values.category || values.level || (showStatus && values.status);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-500" />
        <Input
          aria-label="Search courses"
          placeholder="Search by title, description or instructor…"
          className="pl-9"
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
        <Select aria-label="Category" value={values.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {COURSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select aria-label="Level" value={values.level} onChange={(e) => onChange({ level: e.target.value })}>
          <option value="">All levels</option>
          {COURSE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {capitalize(l)}
            </option>
          ))}
        </Select>
        {showStatus && (
          <Select aria-label="Status" value={values.status} onChange={(e) => onChange({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        )}
        <Select aria-label="Sort" value={values.sort} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="popular">Most popular</option>
          <option value="title">Title A–Z</option>
          <option value="oldest">Oldest</option>
        </Select>
        {active && (
          <button
            onClick={() => onChange({ q: "", category: "", level: "", status: "" })}
            className="flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 text-sm text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
