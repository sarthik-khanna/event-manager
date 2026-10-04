import { handler, json, readJson, requireAuth, routeId, type IdContext } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validations";
import { deleteUser, getUser, updateUserRole } from "@/server/users";

export const GET = handler<IdContext>(async (req, ctx) => {
  await requireAuth(req, "admin");
  return json(await getUser(await routeId(ctx, "User")));
});

export const PATCH = handler<IdContext>(async (req, ctx) => {
  const auth = await requireAuth(req, "admin");
  const id = await routeId(ctx, "User");
  const { role } = userUpdateSchema.parse(await readJson(req));
  return json(await updateUserRole(id, role, auth.sub));
});

export const DELETE = handler<IdContext>(async (req, ctx) => {
  const auth = await requireAuth(req, "admin");
  const id = await routeId(ctx, "User");
  await deleteUser(id, auth.sub);
  return json({ id, deleted: true });
});
