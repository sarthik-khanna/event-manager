import { cookieOptions, handler, json, readJson } from "@/lib/api";
import { AUTH_COOKIE, signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations";
import { authenticate } from "@/server/users";

const WEEK = 60 * 60 * 24 * 7;

export const POST = handler(async (req) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  const user = await authenticate(email, password);
  const token = await signToken({ sub: user.id, name: user.name, email: user.email, role: user.role });

  const res = json({ user, token });
  res.cookies.set(AUTH_COOKIE, token, cookieOptions(WEEK));
  return res;
});
