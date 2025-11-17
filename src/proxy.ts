import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define the protected paths
const protectedPaths = ["/dashboard", "/admin"];
const authPaths = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get user cookie
  const userCookie = request.cookies.get("user")?.value;
  let user = null;
  if (userCookie && userCookie !== "undefined") {
    try {
      user = JSON.parse(userCookie);
    } catch (error) {
      // Invalid JSON in cookie, treat as unauthenticated
      console.error("Invalid user cookie:", error);
      // Optionally, delete the corrupted cookie
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("user");
      return response;
    }
  }

  const isUserAuthenticated = !!user;
  const userRole = user?.role;

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

    // If user is an 'admin' and tries to access a user dashboard route
    // (optional, maybe admins can see user dashboards?)
    // For now, we'll allow it.
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
