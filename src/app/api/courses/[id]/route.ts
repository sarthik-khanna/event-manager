import { getAuth, handler, json, readJson, requireAuth, routeId, type IdContext } from "@/lib/api";
import { courseUpdateSchema } from "@/lib/validations";
import { deleteCourse, getCourse, updateCourse } from "@/server/courses";
import { findUserEnrollment } from "@/server/enrollments";

export const GET = handler<IdContext>(async (req, ctx) => {
  const id = await routeId(ctx, "Course");
  const auth = await getAuth(req);
  const course = await getCourse(id, auth?.role ?? null);
  const enrollment = auth?.role === "student" ? await findUserEnrollment(auth.sub, id) : null;
  return json({ ...course, enrollment });
});

export const PATCH = handler<IdContext>(async (req, ctx) => {
  await requireAuth(req, "admin");
  const id = await routeId(ctx, "Course");
  const input = courseUpdateSchema.parse(await readJson(req));
  return json(await updateCourse(id, input));
});

export const DELETE = handler<IdContext>(async (req, ctx) => {
  await requireAuth(req, "admin");
  const id = await routeId(ctx, "Course");
  await deleteCourse(id);
  return json({ id, deleted: true });
});
