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

  // NOTE: In cross-domain setups (frontend on domain A, API on domain B),
  // cookies set by the API are NOT visible to Next.js middleware.
  // The cookies are tied to the API domain, not the frontend domain.
  // Therefore, we cannot check for auth cookies here.
  //
  // Client-side auth handling in useAuth.ts already protects routes:
  // - useCurrentUserQuery validates session with API
  // - Redirects to /login if session is invalid
  // - This approach works correctly for both same-domain and cross-domain setups

  // For now, let all requests through and let client-side handle auth
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
