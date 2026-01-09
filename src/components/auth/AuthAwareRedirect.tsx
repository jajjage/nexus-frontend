"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that redirects logged-in users away from public pages (like landing page)
 * Uses localStorage cache to quickly determine if user might be logged in
 */
export function AuthAwareRedirect({ children }: AuthRedirectProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Quick check using localStorage cache
    const cachedUser = localStorage.getItem("auth_user_cache");

    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user && user.userId) {
          // User appears to be logged in, redirect to dashboard
          setIsAuthenticated(true);
          if (user.role === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/dashboard");
          }
          return;
        }
      } catch {
        // Invalid cache, clear it and continue
        localStorage.removeItem("auth_user_cache");
      }
    }

    // No valid cache, show the landing page
    setIsChecking(false);
  }, [router]);

  // While checking or redirecting, show nothing (or could show a loader)
  if (isChecking && isAuthenticated) {
    return null;
  }

  // Not authenticated, show the landing page
  return <>{children}</>;
}
