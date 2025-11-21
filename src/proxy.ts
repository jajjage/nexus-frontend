// src/proxy.ts
import { jwtDecode } from "jwt-decode";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface DecodedUser {
  role: string;
  exp: number;
  // Add other properties from your JWT payload if needed
}

// Define the protected paths
const protectedPaths = ["/dashboard", "/admin"];
const authPaths = ["/login", "/register"];

// CHANGED: Export as default function instead of named 'middleware'
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get both accessToken and refreshToken cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  let decodedUser: DecodedUser | null = null;

  if (accessToken) {
    try {
      decodedUser = jwtDecode<DecodedUser>(accessToken);
      // Check if token is expired
      if (Date.now() >= decodedUser.exp * 1000) {
        decodedUser = null;
      }
    } catch (error) {
      console.error("Invalid accessToken:", error);
      decodedUser = null;
    }
  }

  // If accessToken is missing but refreshToken exists, allow through
  // The client-side axios interceptor will handle the token refresh
  const hasValidAccessToken = !!decodedUser;
  const hasRefreshToken = !!refreshToken;

  // User is authenticated if they have a valid accessToken OR a refreshToken
  // (refreshToken means they can get a new accessToken)
  const isUserAuthenticated = hasValidAccessToken || hasRefreshToken;
  const userRole = decodedUser?.role;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // If user is not authenticated, redirect to login
    if (!isUserAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is a 'user' and tries to access an admin route
    // Only check role if we have a valid accessToken (decodedUser exists)
    if (decodedUser && userRole === "user" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If authenticated user tries to access login/register pages
  if (
    isUserAuthenticated &&
    authPaths.some((path) => pathname.startsWith(path))
  ) {
    // If we don't have a decoded user, we can't determine role, so just redirect to dashboard
    // The client-side will handle proper redirection based on actual role
    if (decodedUser && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Matcher configuration remains the same
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
