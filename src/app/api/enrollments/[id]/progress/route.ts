import { handler, json, readJson, requireAuth, routeId, type IdContext } from "@/lib/api";
import { progressSchema } from "@/lib/validations";
import { setLessonProgress } from "@/server/enrollments";

export const PATCH = handler<IdContext>(async (req, ctx) => {
  const auth = await requireAuth(req, "student");
  const id = await routeId(ctx, "Enrollment");
  const { lessonId, completed } = progressSchema.parse(await readJson(req));
  return json(await setLessonProgress(id, auth, lessonId, completed));
});
