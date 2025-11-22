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

import { jwtDecode } from "jwt-decode";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface DecodedToken {
  role: string;
  exp: number;
  userId: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROTECTED_PATHS = ["/dashboard", "/admin"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];
const PUBLIC_PATHS = ["/"];

// ============================================================================
// HELPER: Validate Token Expiration
// ============================================================================

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Check if token is expired
    // exp is in seconds, Date.now() is in milliseconds
    const isExpired = Date.now() >= decoded.exp * 1000;

    return !isExpired;
  } catch (error) {
    console.error("[PROXY] Invalid token:", error);
    return false;
  }
}

// ============================================================================
// HELPER: Extract User Role
// ============================================================================

function getUserRole(token: string | undefined): string | null {
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.role || null;
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // ========================================================================
  // GET TOKENS FROM COOKIES
  // ========================================================================

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // ========================================================================
  // VALIDATE TOKENS
  // ========================================================================

  const isAccessTokenValid = isTokenValid(accessToken);
  const hasRefreshToken = !!refreshToken;
  const userRole = getUserRole(accessToken);

  // User is considered authenticated if:
  // - Access token is valid, OR
  // - Refresh token exists (can be refreshed on client side)
  const isUserAuthenticated = isAccessTokenValid || hasRefreshToken;

  // ========================================================================
  // HANDLE PROTECTED PATHS
  // ========================================================================

  const isProtectedPath = PROTECTED_PATHS.some((path: string) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // If no auth tokens, redirect to login
    if (!isUserAuthenticated) {
      console.log("[PROXY] Unauthenticated user accessing protected path", {
        pathname,
      });
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is regular user but tries to access admin
    if (userRole === "user" && pathname.startsWith("/admin")) {
      console.log("[PROXY] Regular user accessing admin path", {
        pathname,
        userRole,
      });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ========================================================================
  // HANDLE AUTH PATHS (login, register, etc.)
  // ========================================================================
  // Do NOT redirect away from auth pages based solely on access token validity.
  // Let the client verify user profile and handle redirect if needed.

  // ========================================================================
  // ADD METADATA COOKIE
  // ========================================================================

  // Set a readable cookie to indicate auth status
  // Client-side JavaScript can read this to determine initial state
  response.cookies.set(
    "auth_status",
    isUserAuthenticated ? "authenticated" : "unauthenticated",
    {
      httpOnly: false, // Client can read this
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    }
  );

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
