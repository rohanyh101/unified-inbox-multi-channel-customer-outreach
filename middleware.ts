import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /login)
  const path = request.nextUrl.pathname;

  // Define paths that are considered public (accessible without login)
  const isPublicPath = path === "/login" || path === "/register" || path === "/" || path.startsWith("/api/auth");

  // Get token from cookies
  const token = request.cookies.get("better-auth.session_token")?.value;

  // If it's a public path and user has token, redirect to dashboard
  if (isPublicPath && token && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  // If it's not a public path and no token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
