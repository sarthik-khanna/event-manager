import { cookieOptions, handler, json } from "@/lib/api";
import { AUTH_COOKIE } from "@/lib/jwt";

export const POST = handler(async () => {
  const res = json({ message: "Logged out" });
  res.cookies.set(AUTH_COOKIE, "", cookieOptions(0));
  return res;
});
