import { handler, json, requireAuth } from "@/lib/api";
import { getAdminStats } from "@/server/stats";

export const GET = handler(async (req) => {
  await requireAuth(req, "admin");
  return json(await getAdminStats());
});
