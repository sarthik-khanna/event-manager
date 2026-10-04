import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import { courses, enrollments, lessons, type Role } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { courseInputSchema, courseQuerySchema, courseUpdateSchema } from "@/lib/validations";
import { recalculateProgress } from "./progress";

type CourseQuery = z.output<typeof courseQuerySchema>;
type CourseInput = z.output<typeof courseInputSchema>;
type CourseUpdate = z.output<typeof courseUpdateSchema>;

// Drizzle omits table qualifiers in single-table selects, so `${courses.id}` would render as a bare
// "id" and bind to the subquery's own table. Reference the outer table explicitly.
const enrollmentCount = sql<number>`(select count(*)::int from ${enrollments} where ${enrollments.courseId} = "courses"."id")`;
const lessonCount = sql<number>`(select count(*)::int from ${lessons} where ${lessons.courseId} = "courses"."id")`;

const courseColumns = {
  id: courses.id,
  title: courses.title,
  description: courses.description,
  category: courses.category,
  level: courses.level,
  instructor: courses.instructor,
  thumbnailUrl: courses.thumbnailUrl,
  durationHours: courses.durationHours,
  isPublished: courses.isPublished,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  enrollmentCount,
  lessonCount,
};

export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listCourses(query: CourseQuery, role: Role | null) {
  const db = getDb();
  const filters: SQL[] = [];

  // Students and visitors only ever see published courses; admins default to everything.
  const status = role === "admin" ? (query.status ?? "all") : "published";
  if (status === "published") filters.push(eq(courses.isPublished, true));
  if (status === "draft") filters.push(eq(courses.isPublished, false));
  if (query.category) filters.push(eq(courses.category, query.category));
  if (query.level) filters.push(eq(courses.level, query.level));
  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    filters.push(
      or(ilike(courses.title, term), ilike(courses.description, term), ilike(courses.instructor, term))!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const orderBy = {
    newest: [desc(courses.createdAt)],
    oldest: [asc(courses.createdAt)],
    title: [asc(courses.title)],
    popular: [desc(enrollmentCount), desc(courses.createdAt)],
  }[query.sort];

  const offset = (query.page - 1) * query.limit;
  const [items, [{ total }]] = await Promise.all([
    db
      .select(courseColumns)
      .from(courses)
      .where(where)
      .orderBy(...orderBy)
      .limit(query.limit)
      .offset(offset),
    db.select({ total: count() }).from(courses).where(where),
  ]);

  return {
    items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function getCourse(id: string, role: Role | null) {
  const db = getDb();
  const [course] = await db.select(courseColumns).from(courses).where(eq(courses.id, id)).limit(1);
  if (!course || (!course.isPublished && role !== "admin")) throw new ApiError(404, "Course not found");

  const courseLessons = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      content: lessons.content,
      videoUrl: lessons.videoUrl,
      durationMinutes: lessons.durationMinutes,
      position: lessons.position,
    })
    .from(lessons)
    .where(eq(lessons.courseId, id))
    .orderBy(asc(lessons.position));

  return { ...course, lessons: courseLessons };
}

function lessonRows(courseId: string, input: CourseInput["lessons"]) {
  return input.map((lesson, position) => ({
    id: lesson.id ?? crypto.randomUUID(),
    courseId,
    title: lesson.title,
    content: lesson.content,
    videoUrl: lesson.videoUrl || null,
    durationMinutes: lesson.durationMinutes,
    position,
  }));
}

export async function createCourse(input: CourseInput, createdBy: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  const { lessons: lessonInput, ...data } = input;

  // neon-http has no interactive transactions; batch() runs the statements in one transaction.
  await db.batch([
    db.insert(courses).values({ ...data, id, thumbnailUrl: data.thumbnailUrl || null, createdBy }),
    db.insert(lessons).values(lessonRows(id, lessonInput.map(({ id: _ignored, ...l }) => l))),
  ]);
  return getCourse(id, "admin");
}

export async function updateCourse(id: string, input: CourseUpdate) {
  const db = getDb();
  const [existing] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "Course not found");

  const { lessons: lessonInput, ...data } = input;
  if (Object.keys(data).length) {
    await db
      .update(courses)
      .set({ ...data, ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl || null }) })
      .where(eq(courses.id, id));
  }

  if (lessonInput) {
    const current = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, id));
    const currentIds = new Set(current.map((l) => l.id));
    // Ignore client-supplied ids that don't belong to this course.
    const rows = lessonRows(
      id,
      lessonInput.map((l) => (l.id && currentIds.has(l.id) ? l : { ...l, id: undefined })),
    );
    const keepIds = rows.map((r) => r.id).filter((rid) => currentIds.has(rid));
    const removeIds = [...currentIds].filter((cid) => !keepIds.includes(cid));
    const toInsert = rows.filter((r) => !currentIds.has(r.id));
    const toUpdate = rows.filter((r) => currentIds.has(r.id));

    const statements = [
      ...(removeIds.length ? [db.delete(lessons).where(inArray(lessons.id, removeIds))] : []),
      ...toUpdate.map(({ id: lessonId, courseId: _c, ...rest }) =>
        db.update(lessons).set(rest).where(eq(lessons.id, lessonId)),
      ),
      ...(toInsert.length ? [db.insert(lessons).values(toInsert)] : []),
    ];
    if (statements.length) await db.batch(statements as [(typeof statements)[number], ...typeof statements]);
    if (removeIds.length || toInsert.length) await recalculateProgress({ courseId: id });
  }

  return getCourse(id, "admin");
}

export async function deleteCourse(id: string) {
  const db = getDb();
  const deleted = await db.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id });
  if (!deleted.length) throw new ApiError(404, "Course not found");
}
