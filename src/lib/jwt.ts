import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";

// Edge-safe JWT helpers (used by both proxy.ts and route handlers).

export const AUTH_COOKIE = "cms_token";

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
}

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ name: payload.name, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(secretKey());
}

export async function verifyToken(token: string | undefined | null): Promise<TokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || (payload.role !== "student" && payload.role !== "admin")) return null;
    return {
      sub: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function dashboardPath(role: Role) {
  return role === "admin" ? "/admin" : "/student";
}
