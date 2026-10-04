import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import { courses, enrollments, lessonProgress, lessons, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { TokenPayload } from "@/lib/jwt";
import type { enrollmentQuerySchema } from "@/lib/validations";
import { escapeLike } from "./courses";
import { recalculateProgress } from "./progress";

type EnrollmentQuery = z.output<typeof enrollmentQuerySchema>;

const lessonCount = sql<number>`(select count(*)::int from ${lessons} where ${lessons.courseId} = ${courses.id})`;

const enrollmentColumns = {
  id: enrollments.id,
  status: enrollments.status,
  progress: enrollments.progress,
  enrolledAt: enrollments.enrolledAt,
  completedAt: enrollments.completedAt,
  lastAccessedAt: enrollments.lastAccessedAt,
  user: { id: users.id, name: users.name, email: users.email },
  course: {
    id: courses.id,
    title: courses.title,
    category: courses.category,
    level: courses.level,
    instructor: courses.instructor,
    thumbnailUrl: courses.thumbnailUrl,
    durationHours: courses.durationHours,
    lessonCount,
  },
};

export async function listEnrollments(query: EnrollmentQuery, auth: TokenPayload) {
  const db = getDb();
  const filters: SQL[] = [];

  // Students can only ever see their own enrollments.
  if (auth.role === "student") filters.push(eq(enrollments.userId, auth.sub));
  else if (query.userId) filters.push(eq(enrollments.userId, query.userId));
  if (query.courseId) filters.push(eq(enrollments.courseId, query.courseId));
  if (query.status) filters.push(eq(enrollments.status, query.status));
  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    filters.push(or(ilike(courses.title, term), ilike(users.name, term), ilike(users.email, term))!);
  }
  const where = filters.length ? and(...filters) : undefined;
  const offset = (query.page - 1) * query.limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select(enrollmentColumns)
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(where)
      .orderBy(desc(enrollments.lastAccessedAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(where),
  ]);

  return {
    items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function enroll(userId: string, courseId: string) {
  const db = getDb();
  const [course] = await db
    .select({ id: courses.id, isPublished: courses.isPublished })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course || !course.isPublished) throw new ApiError(404, "Course not found");

  const [created] = await db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
    .returning({ id: enrollments.id });
  if (!created) throw new ApiError(409, "You are already enrolled in this course");
  return created;
}

async function findEnrollment(id: string, auth: TokenPayload) {
  const [row] = await getDb()
    .select({ id: enrollments.id, userId: enrollments.userId, courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);
  // Respond 404 rather than 403 so students can't probe other students' enrollment ids.
  if (!row || (auth.role === "student" && row.userId !== auth.sub)) {
    throw new ApiError(404, "Enrollment not found");
  }
  return row;
}

export async function getEnrollment(id: string, auth: TokenPayload) {
  const db = getDb();
  const found = await findEnrollment(id, auth);

  if (auth.role === "student") {
    await db.update(enrollments).set({ lastAccessedAt: new Date() }).where(eq(enrollments.id, id));
  }

  const [[enrollment], courseLessons, completed] = await Promise.all([
    db
      .select(enrollmentColumns)
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.id, id)),
    db
      .select({
        id: lessons.id,
        title: lessons.title,
        content: lessons.content,
        videoUrl: lessons.videoUrl,
        durationMinutes: lessons.durationMinutes,
        position: lessons.position,
      })
      .from(lessons)
      .where(eq(lessons.courseId, found.courseId))
      .orderBy(asc(lessons.position)),
    db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, id)),
  ]);

  return { ...enrollment, lessons: courseLessons, completedLessonIds: completed.map((c) => c.lessonId) };
}

export async function setLessonProgress(id: string, auth: TokenPayload, lessonId: string, completed: boolean) {
  const db = getDb();
  const found = await findEnrollment(id, auth);
  if (auth.role !== "student") throw new ApiError(403, "Only the enrolled student can update progress");

  const [lesson] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, found.courseId)))
    .limit(1);
  if (!lesson) throw new ApiError(404, "Lesson not found in this course");

  if (completed) {
    await db.insert(lessonProgress).values({ enrollmentId: id, lessonId }).onConflictDoNothing();
  } else {
    await db
      .delete(lessonProgress)
      .where(and(eq(lessonProgress.enrollmentId, id), eq(lessonProgress.lessonId, lessonId)));
  }
  await recalculateProgress({ enrollmentId: id });
  return getEnrollment(id, auth);
}

export async function deleteEnrollment(id: string, auth: TokenPayload) {
  await findEnrollment(id, auth);
  await getDb().delete(enrollments).where(eq(enrollments.id, id));
}

/** Enrollment for a given user + course (used by course detail page). */
export async function findUserEnrollment(userId: string, courseId: string) {
  const [row] = await getDb()
    .select({ id: enrollments.id, status: enrollments.status, progress: enrollments.progress })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return row ?? null;
}
