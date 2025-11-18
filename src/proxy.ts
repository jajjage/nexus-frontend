// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

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

  // Get accessToken cookie
  const token = request.cookies.get("accessToken")?.value;
  let decodedUser: DecodedUser | null = null;

  if (token) {
    try {
      decodedUser = jwtDecode<DecodedUser>(token);
      // Check if token is expired
      if (Date.now() >= decodedUser.exp * 1000) {
        decodedUser = null;
      }
    } catch (error) {
      console.error("Invalid token:", error);
      decodedUser = null;
    }
  }

  const isUserAuthenticated = !!decodedUser;
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
    if (userRole === "user" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If authenticated user tries to access login/register pages
  if (
    isUserAuthenticated &&
    authPaths.some((path) => pathname.startsWith(path))
  ) {
    if (userRole === "admin") {
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
