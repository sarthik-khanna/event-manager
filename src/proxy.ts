import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, dashboardPath, verifyToken } from "@/lib/jwt";

// Optimistic route protection. Layouts and API handlers re-verify the JWT themselves.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifyToken(req.cookies.get(AUTH_COOKIE)?.value);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) {
    return session ? NextResponse.redirect(new URL(dashboardPath(session.role), req.url)) : NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const requiredRole = pathname.startsWith("/admin") ? "admin" : "student";
  if (session.role !== requiredRole) {
    return NextResponse.redirect(new URL(dashboardPath(session.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/login", "/register"],
};
