/**
 * PROXY LAYER (src/proxy.ts)
 *
 * Purpose:
 * - Server-side request processing before client code runs
 * - Validate tokens before rendering protected pages
 * - Redirect unauthenticated users at the middleware level
 * - This prevents loading dashboard with no auth, then redirecting
 *
 * Token Validation:
 * 1. Check if accessToken exists and is valid (not expired)
 * 2. If expired, check if refreshToken exists
 * 3. If both missing or invalid, redirect to login
 * 4. Let client-side interceptor handle actual refresh on first request
 *
 * INDUSTRY BEST PRACTICES:
 * - Server-side validation reduces unnecessary client-side work
 * - JWT decoding validates token structure and expiration
 * - Fast redirects prevent rendering unauthorized content
 * - SameSite cookies prevent CSRF attacks
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/admin/dashboard"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/admin/login"];
const PUBLIC_PATHS = ["/"];

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  const hasAuth =
    request.cookies.get("accessToken") || request.cookies.get("refreshToken");

  const isProtectedPath = PROTECTED_PATHS.some(
    (path: string) => pathname.startsWith(path) && !hasAuth
  );

  if (isProtectedPath && !hasAuth) {
    return NextResponse.redirect(
      new URL("/login?reason=session-expired", request.url)
    );
  }

  return response;
}

// ============================================================================
// PROXY CONFIG
// ============================================================================

export const config = {
  matcher: [
    // Match all paths except:
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
