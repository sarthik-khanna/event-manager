import { handler, json, requireAuth, searchParams } from "@/lib/api";
import { userQuerySchema } from "@/lib/validations";
import { listUsers } from "@/server/users";

export const GET = handler(async (req) => {
  await requireAuth(req, "admin");
  return json(await listUsers(userQuerySchema.parse(searchParams(req))));
});
