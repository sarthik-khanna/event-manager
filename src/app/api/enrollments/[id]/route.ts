import { handler, json, requireAuth, routeId, type IdContext } from "@/lib/api";
import { deleteEnrollment, getEnrollment } from "@/server/enrollments";

export const GET = handler<IdContext>(async (req, ctx) => {
  const auth = await requireAuth(req);
  const id = await routeId(ctx, "Enrollment");
  return json(await getEnrollment(id, auth));
});

// Students can unenroll themselves; admins can remove any enrollment.
export const DELETE = handler<IdContext>(async (req, ctx) => {
  const auth = await requireAuth(req);
  const id = await routeId(ctx, "Enrollment");
  await deleteEnrollment(id, auth);
  return json({ id, deleted: true });
});
