"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useSecurityStore } from "@/store/securityStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * SecurityGuard Component
 *
 * Responsibilities:
 * - Monitor app state (LOADING → ACTIVE)
 * - Hide sensitive content while LOADING
 *
 * NOTE: Soft-lock feature is disabled and marked as upcoming feature
 * All soft-lock implementation files are preserved in:
 * - src/services/soft-lock.service.ts
 * - src/store/securityStore.ts (soft-lock methods)
 * - src/components/auth/SoftLockOverlay.tsx
 * - src/components/auth/InactivityWarning.tsx
 *
 * Protected Routes: /dashboard/*, /profile, etc.
 * Public Routes: /, /login, /register (no soft-lock needed)
 *
 * Placement: Inside AuthProvider, wrapping main app
 */
export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { appState, initialize, cleanup } = useSecurityStore();
  const pathname = usePathname();
  const { user } = useAuthContext();

  // List of public routes that don't need protection
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"];

  // Check if current route is protected
  const isProtectedRoute = !publicRoutes.some(
    (route) => route === pathname || pathname.startsWith(route)
  );

  useEffect(() => {
    console.log("[SecurityGuard] Mounting - initializing app state", {
      pathname,
      isProtectedRoute,
    });

    // Initialize app state
    initialize();

    return () => {
      console.log("[SecurityGuard] Unmounting - cleaning up");
      cleanup();
    };
  }, [initialize, cleanup, isProtectedRoute]);

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
      {/* Soft-lock feature disabled - marked as upcoming feature */}
      {/* Remove the following components when soft-lock is re-enabled: */}
      {/* <SoftLockOverlay /> */}
      {/* <InactivityWarning /> */}
    </>
  );
}
