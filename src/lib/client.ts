// Thin fetch wrapper for the app's REST API. The JWT travels in an httpOnly cookie.

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiClientError(res.status, body?.error?.message ?? "Something went wrong", body?.error?.details);
  }
  return body.data as T;
}

export function toQuery(params: Record<string, string | number | undefined | null>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Response shapes (mirror src/server/*).
export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor: string;
  thumbnailUrl: string | null;
  durationHours: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  lessonCount: number;
}

export interface LessonDto {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  durationMinutes: number;
  position: number;
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonDto[];
  enrollment?: { id: string; status: "active" | "completed"; progress: number } | null;
}

export interface EnrollmentDto {
  id: string;
  status: "active" | "completed";
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string;
  user: { id: string; name: string; email: string };
  course: {
    id: string;
    title: string;
    category: string;
    level: "beginner" | "intermediate" | "advanced";
    instructor: string;
    thumbnailUrl: string | null;
    durationHours: number;
    lessonCount: number;
  };
}

export interface EnrollmentDetail extends EnrollmentDto {
  lessons: LessonDto[];
  completedLessonIds: string[];
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  createdAt: string;
  enrollmentCount: number;
  completedCount: number;
}
