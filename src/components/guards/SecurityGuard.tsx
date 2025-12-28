"use client";

import { SoftLockOverlay } from "@/components/auth/SoftLockOverlay";
import { SoftLockService } from "@/services/soft-lock.service";
import { useSecurityStore } from "@/store/securityStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * SecurityGuard Component
 *
 * Responsibilities:
 * - Initialize soft-lock on mount
 * - Monitor app state (LOADING → ACTIVE/LOCKED)
 * - Render lock overlay when needed (ONLY on protected routes)
 * - Hide sensitive content while LOADING
 *
 * Protected Routes: /dashboard/*, /profile, etc.
 * Public Routes: /, /login, /register (no soft-lock needed)
 *
 * Placement: Inside AuthProvider, wrapping main app
 */
export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { appState, initialize, cleanup, recordActivity } = useSecurityStore();
  const pathname = usePathname();

  // List of public routes that don't need soft-lock protection
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"];

  // Check if current route is protected
  const isProtectedRoute = !publicRoutes.some(
    (route) => route === pathname || pathname.startsWith(route)
  );

  useEffect(() => {
    console.log("[SecurityGuard] Mounting - initializing security", {
      pathname,
      isProtectedRoute,
    });

    // Initialize security store (checks inactivity timer, starts checks)
    initialize();

    // Setup activity tracking
    SoftLockService.initialize(() => {
      console.log("[SecurityGuard] Activity detected");
      recordActivity();
    });

    return () => {
      console.log("[SecurityGuard] Unmounting - cleaning up security");
      cleanup();
      SoftLockService.cleanup();
    };
  }, [initialize, cleanup, recordActivity, isProtectedRoute]);

  // Prevent flash of content while checking lock state (ONLY on protected routes)
  if (isProtectedRoute && appState === "LOADING") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Only show soft-lock overlay on protected routes */}
      {isProtectedRoute && appState === "LOCKED" && <SoftLockOverlay />}
    </>
  );
}
