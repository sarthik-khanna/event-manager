import "server-only";
import { count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { courses, enrollments, users } from "@/db/schema";

export async function getAdminStats() {
  const db = getDb();

  const [[userCounts], [courseCounts], [enrollmentCounts], topCourses, byCategory, recent] = await Promise.all([
    db
      .select({
        students: sql<number>`count(*) filter (where ${users.role} = 'student')::int`,
        admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
      })
      .from(users),
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${courses.isPublished})::int`,
      })
      .from(courses),
    db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${enrollments.status} = 'completed')::int`,
        averageProgress: sql<number>`coalesce(round(avg(${enrollments.progress})), 0)::int`,
      })
      .from(enrollments),
    db
      .select({
        id: courses.id,
        title: courses.title,
        category: courses.category,
        enrollments: count(enrollments.id),
        averageProgress: sql<number>`coalesce(round(avg(${enrollments.progress})), 0)::int`,
      })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .groupBy(courses.id)
      .orderBy(desc(count(enrollments.id)), courses.title)
      .limit(5),
    db
      .select({ category: courses.category, courses: sql<number>`count(distinct ${courses.id})::int`, enrollments: count(enrollments.id) })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .groupBy(courses.category)
      .orderBy(desc(count(enrollments.id))),
    db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        progress: enrollments.progress,
        status: enrollments.status,
        studentName: users.name,
        courseTitle: courses.title,
      })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.userId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(6),
  ]);

  return {
    totals: {
      students: userCounts.students,
      admins: userCounts.admins,
      courses: courseCounts.total,
      publishedCourses: courseCounts.published,
      enrollments: enrollmentCounts.total,
      completedEnrollments: enrollmentCounts.completed,
      averageProgress: enrollmentCounts.averageProgress,
      completionRate: enrollmentCounts.total
        ? Math.round((enrollmentCounts.completed / enrollmentCounts.total) * 100)
        : 0,
    },
    topCourses,
    byCategory,
    recentEnrollments: recent,
  };
}
