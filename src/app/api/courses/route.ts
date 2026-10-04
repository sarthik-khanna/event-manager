import { getAuth, handler, json, readJson, requireAuth, searchParams } from "@/lib/api";
import { courseInputSchema, courseQuerySchema } from "@/lib/validations";
import { createCourse, listCourses } from "@/server/courses";

export const GET = handler(async (req) => {
  const auth = await getAuth(req);
  const query = courseQuerySchema.parse(searchParams(req));
  return json(await listCourses(query, auth?.role ?? null));
});

export const POST = handler(async (req) => {
  const auth = await requireAuth(req, "admin");
  const input = courseInputSchema.parse(await readJson(req));
  return json(await createCourse(input, auth.sub), 201);
});
