import "server-only";
import bcrypt from "bcryptjs";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import { enrollments, users, type Role } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { userQuerySchema } from "@/lib/validations";
import { escapeLike } from "./courses";

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
};

let DUMMY_HASH: string | undefined;

export async function createUser(data: { name: string; email: string; password: string; role?: Role }) {
  const db = getDb();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: data.name, email: data.email, passwordHash, role: data.role ?? "student" })
    .onConflictDoNothing({ target: users.email })
    .returning(publicColumns);
  if (!user) throw new ApiError(409, "An account with this email already exists", { email: "Email already registered" });
  return user;
}

export async function authenticate(email: string, password: string) {
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  // Compare against a dummy hash when the user is missing to keep timing uniform.
  const hash = user?.passwordHash ?? (DUMMY_HASH ??= await bcrypt.hash("not-a-real-password", 10));
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) throw new ApiError(401, "Invalid email or password");
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function getUser(id: string) {
  const [user] = await getDb().select(publicColumns).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function listUsers(query: z.output<typeof userQuerySchema>) {
  const db = getDb();
  const filters: SQL[] = [];
  if (query.role) filters.push(eq(users.role, query.role));
  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    filters.push(or(ilike(users.name, term), ilike(users.email, term))!);
  }
  const where = filters.length ? and(...filters) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        ...publicColumns,
        enrollmentCount: sql<number>`(select count(*)::int from ${enrollments} where ${enrollments.userId} = ${users.id})`,
        completedCount: sql<number>`(select count(*)::int from ${enrollments} where ${enrollments.userId} = ${users.id} and ${enrollments.status} = 'completed')`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return {
    items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function updateUserRole(id: string, role: Role, actorId: string) {
  if (id === actorId) throw new ApiError(400, "You cannot change your own role");
  const [user] = await getDb().update(users).set({ role }).where(eq(users.id, id)).returning(publicColumns);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) throw new ApiError(400, "You cannot delete your own account");
  const deleted = await getDb().delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (!deleted.length) throw new ApiError(404, "User not found");
}
