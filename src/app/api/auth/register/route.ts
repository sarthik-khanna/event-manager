import { cookieOptions, handler, json, readJson } from "@/lib/api";
import { AUTH_COOKIE, signToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/validations";
import { createUser } from "@/server/users";

const WEEK = 60 * 60 * 24 * 7;

// Public sign-up always creates a student. Admins are created by the seed script or promoted by an admin.
export const POST = handler(async (req) => {
  const input = registerSchema.parse(await readJson(req));
  const user = await createUser({ name: input.name, email: input.email, password: input.password });
  const token = await signToken({ sub: user.id, name: user.name, email: user.email, role: user.role });

  const res = json({ user, token }, 201);
  res.cookies.set(AUTH_COOKIE, token, cookieOptions(WEEK));
  return res;
});
