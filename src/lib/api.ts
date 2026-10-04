import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Role } from "@/db/schema";
import { AUTH_COOKIE, verifyToken, type TokenPayload } from "./jwt";
import { fieldErrors } from "./validations";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(status: number, message: string, details?: Record<string, string>) {
  return NextResponse.json({ success: false, error: { message, details } }, { status });
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform error handling for ApiError, ZodError and unexpected errors. */
export function handler<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.status, err.message, err.details);
      if (err instanceof z.ZodError) return errorResponse(422, "Validation failed", fieldErrors(err));
      if (err instanceof SyntaxError) return errorResponse(400, "Malformed JSON body");
      console.error(err);
      return errorResponse(500, "Internal server error");
    }
  };
}

/** Reads the JWT from the `Authorization: Bearer` header or the auth cookie. */
export async function getAuth(req: NextRequest): Promise<TokenPayload | null> {
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  return verifyToken(bearer ?? req.cookies.get(AUTH_COOKIE)?.value);
}

export async function requireAuth(req: NextRequest, role?: Role): Promise<TokenPayload> {
  const auth = await getAuth(req);
  if (!auth) throw new ApiError(401, "Authentication required");
  if (role && auth.role !== role) throw new ApiError(403, "You do not have permission to perform this action");
  return auth;
}

export async function readJson(req: NextRequest): Promise<unknown> {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

export function searchParams(req: NextRequest) {
  // Drop empty values so optional zod fields stay undefined.
  return Object.fromEntries([...req.nextUrl.searchParams].filter(([, v]) => v !== ""));
}

export type IdContext = { params: Promise<{ id: string }> };

/** Resolves and validates a `[id]` route param (invalid UUIDs would otherwise make Postgres throw). */
export async function routeId(ctx: IdContext, label = "Resource") {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, `${label} not found`);
  return id;
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
