import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Recomputes `progress`, `status` and `completed_at` for enrollments from the
 * lesson_progress table. Scope it to one enrollment or every enrollment of a course
 * (e.g. after lessons were added/removed).
 */
export async function recalculateProgress(scope: { enrollmentId: string } | { courseId: string }) {
  const filter =
    "enrollmentId" in scope ? sql`en.id = ${scope.enrollmentId}` : sql`en.course_id = ${scope.courseId}`;

  await getDb().execute(sql`
    UPDATE enrollments e SET
      progress = sub.pct,
      status = CASE WHEN sub.pct = 100 THEN 'completed'::enrollment_status ELSE 'active'::enrollment_status END,
      completed_at = CASE WHEN sub.pct = 100 THEN COALESCE(e.completed_at, now()) ELSE NULL END
    FROM (
      SELECT en.id,
        CASE WHEN t.total = 0 THEN 0
             ELSE ((SELECT count(*) FROM lesson_progress lp WHERE lp.enrollment_id = en.id) * 100 / t.total)::int
        END AS pct
      FROM enrollments en
      CROSS JOIN LATERAL (SELECT count(*) AS total FROM lessons l WHERE l.course_id = en.course_id) t
      WHERE ${filter}
    ) sub
    WHERE e.id = sub.id
  `);
}
