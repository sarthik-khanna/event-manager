import { handler, json, readJson, requireAuth, searchParams } from "@/lib/api";
import { enrollmentQuerySchema, enrollSchema } from "@/lib/validations";
import { enroll, getEnrollment, listEnrollments } from "@/server/enrollments";

export const GET = handler(async (req) => {
  const auth = await requireAuth(req);
  const query = enrollmentQuerySchema.parse(searchParams(req));
  return json(await listEnrollments(query, auth));
});

export const POST = handler(async (req) => {
  const auth = await requireAuth(req, "student");
  const { courseId } = enrollSchema.parse(await readJson(req));
  const { id } = await enroll(auth.sub, courseId);
  return json(await getEnrollment(id, auth), 201);
});
