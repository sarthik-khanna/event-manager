import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { AUTH_COOKIE, dashboardPath, verifyToken } from "./jwt";

/** Session for Server Components / layouts (reads the httpOnly JWT cookie). */
export async function getSession() {
  const store = await cookies();
  return verifyToken(store.get(AUTH_COOKIE)?.value);
}

/** Server-side guard for dashboard layouts; complements the optimistic check in proxy.ts. */
export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(dashboardPath(session.role));
  return session;
}
