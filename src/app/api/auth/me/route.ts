import { handler, json, requireAuth } from "@/lib/api";
import { getUser } from "@/server/users";

export const GET = handler(async (req) => {
  const auth = await requireAuth(req);
  return json({ user: await getUser(auth.sub) });
});
