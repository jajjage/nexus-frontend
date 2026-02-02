"use client";

import { useAuthContext } from "@/context/AuthContext";
import {
  setAuthLoadingCallback,
  setRedirectReasonCallback,
  setSessionExpiredCallback,
} from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { credentialManager } from "@/services/credential-manager.service";
import { User } from "@/types/api.types";
import { RegisterRequest } from "@/types/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";

/**
 * BEST PRACTICES FOR USER AUTH STATE:
 *
 * 1. CACHE STRATEGY (5 minutes):
 *    - First request fetches fresh data from server
 *    - Subsequent requests within 5 minutes use cached data
 *    - This prevents N+1 requests on page navigation
 *    - User profile doesn't change frequently, so 5 min is safe
 *
 * 2. STALE DATA HANDLING:
 *    - Data is considered fresh for 5 minutes
 *    - After 5 minutes, next request will refetch (in background if not loading)
 *    - No unnecessary UI blocking
 *
 * 3. NO AUTOMATIC REFETCH:
 *    - refetchOnMount: false - prevents duplicate requests
 *    - refetchOnWindowFocus: false - prevents unnecessary requests on tab switch
 *    - Manual refetch available via the refetch() function
 *
 * 4. ERROR HANDLING:
 *    - 401 errors handled by axios interceptor
 *    - No retry at React Query level (let interceptor handle it)
 *    - Session expiration handled via context
 *
 * 5. SINGLE SOURCE OF TRUTH:
 *    - AuthContext holds the current user state
 *    - React Query manages server sync
 *    - Both are in sync via callbacks
 */

// Query keys for React Query cache
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// ============================================================================
// ROLE-BASED LOGIN URL HELPERS
// ============================================================================

/**
 * Store user role in localStorage for use during session expiry redirect
 * CRITICAL: Must be called whenever user is set, BEFORE session expires
 */
function storeUserRole(role: string | undefined) {
  if (typeof window === "undefined") return;
  if (role) {
    localStorage.setItem("auth_user_role", role);
  } else {
    localStorage.removeItem("auth_user_role");
  }
}

/**
 * Get the correct login URL based on stored user role
 * Used during session expiry when user object is already null
 */
function getStoredLoginUrl(): string {
  if (typeof window === "undefined") return "/login";
  const role = localStorage.getItem("auth_user_role");
  const baseUrl =
    role === "admin" || role === "staff" ? "/admin/login" : "/login";

  // Capture current path for redirect back
  const currentPath = window.location.pathname + window.location.search;
  if (
    currentPath &&
    currentPath !== "/" &&
    !currentPath.startsWith("/login") &&
    !currentPath.startsWith("/admin/login") &&
    !currentPath.startsWith("/register")
  ) {
    return `${baseUrl}?returnUrl=${encodeURIComponent(currentPath)}`;
  }

  return baseUrl;
}

// ============================================================================
// FETCH CURRENT USER - REACT QUERY
// ============================================================================

/**
 * Fetch user profile from server
 *
 * Strategy:
 * - Only fetches when user was previously authenticated (cached in localStorage)
 * - Checks localStorage cache, not just cookie existence
 * - Result cached for 3 minutes
 * - No automatic refetch unless explicitly triggered
 * - Updates AuthContext on success
 * - 401 errors are handled by axios interceptor
 */
function useCurrentUserQuery() {
  const { setUser, setIsLoading, markSessionAsExpired, setIsSessionExpired } =
    useAuthContext();
  const router = useRouter();

  // Check if user was previously authenticated (cached in localStorage)
  // This is more reliable than checking cookies, as it only exists when user successfully logged in
  const hasCachedUser =
    typeof window !== "undefined" &&
    localStorage.getItem("auth_user_cache") !== null;

  const query = useQuery<User | null, AxiosError>({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      console.log("[AUTH] Fetching user profile from server");
      try {
        const user = await authService.getProfile();
        console.log("[AUTH] User profile fetched successfully", {
          userId: user?.userId,
        });
        return user;
      } catch (error: any) {
        console.log("[AUTH] Failed to fetch user profile", {
          status: error.response?.status,
          message: error.message,
        });

        // If we get 401 and refresh fails, interceptor will handle it
        // Just re-throw so React Query treats it as an error
        throw error;
      }
    },

    // CACHING STRATEGY
    staleTime: 3 * 60 * 1000, // Keep data fresh for 3 minutes
    gcTime: 7 * 60 * 1000, // Keep in memory for 7 minutes

    // REFETCH STRATEGY
    refetchOnMount: "always", // Always refetch on mount to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window comes into focus to handle webhook updates
    refetchOnReconnect: true, // Only refetch if network reconnected

    // ERROR HANDLING
    // Don't retry here - let axios interceptor handle all 401 errors and token refresh
    // The interceptor will automatically retry the request after refreshing the token
    retry: 0,
    // Only fetch if user was previously authenticated (has cache)
    // This prevents calls on public routes and prevents redirect loops
    enabled: hasCachedUser,
  });

  // Handle success - update context when user data is fetched
  useEffect(() => {
    if (query.data !== undefined && query.isSuccess) {
      console.log("[AUTH] User profile updated in context", {
        userId: query.data?.userId,
        role: query.data?.role,
      });
      setUser(query.data);
      setIsLoading(false);
      // CRITICAL: Store role for session expiry redirect
      storeUserRole(query.data?.role);
    }
  }, [query.data, query.isSuccess, setUser, setIsLoading]);

  // Handle error - mark session as expired if auth error
  useEffect(() => {
    if (query.isError) {
      const status = query.error?.response?.status;
      const message =
        (query.error?.response?.data as any)?.message ||
        (query.error as any)?.message;

      console.error("[AUTH] User profile fetch error", {
        status,
        message,
        errorData: query.error?.response?.data,
      });

      // Mark session as expired on auth errors
      // The axios interceptor has already attempted refresh on 401
      // If we still get 401 here, it means refresh failed
      if (
        status === 401 ||
        status === 400 ||
        status === 403 ||
        status === 404
      ) {
        console.error(
          "[AUTH] Auth error detected - marking session as expired",
          { status }
        );

        // Mark session as expired
        markSessionAsExpired();
        setIsSessionExpired(true);

        // For 404 (user deleted), immediately trigger redirect
        if (status === 404) {
          toast.error("Sorry ", {
            description: "You can try login again",
          });
          console.error(
            "[AUTH] User not found (404) - forcing immediate redirect"
          );
          setTimeout(() => {
            console.log("[AUTH] Executing immediate 404 redirect");
            if (typeof window !== "undefined") {
              const loginUrl = getStoredLoginUrl();
              console.log("[AUTH] Redirecting to", loginUrl);
              window.location.href = loginUrl;
            }
          }, 0);
        }
      }

      setIsLoading(false);
    }
  }, [
    query.isError,
    query.error,
    markSessionAsExpired,
    setIsSessionExpired,
    setIsLoading,
  ]);

  return query;
}

// ============================================================================
// MAIN AUTH HOOK
// ============================================================================

/**
 * useAuth Hook - Main interface for auth state
 *
 * Usage:
 * const { user, isAuthenticated, isLoading } = useAuth();
 *
 * Returns:
 * - user: Current user object or null
 * - isAuthenticated: True if user is logged in and not suspended
 * - isLoading: True while fetching user profile
 * - isAuthLoading: True while any auth operation is in progress
 * - refetch: Manually refetch user profile
 * - checkPermission: Check if user has specific permission
 * - checkRole: Check if user has specific role
 */
export function useAuth(): {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthLoading: boolean;
  isError: boolean;
  refetch: () => void;
  checkPermission: (permission: string) => boolean;
  checkRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
} {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    isLoading,
    isSessionExpired,
    setIsSessionExpired,
    setRedirectReason,
  } = useAuthContext();

  const {
    data: fetchedUser,
    isLoading: isFetching,
    isError,
    refetch,
  } = useCurrentUserQuery();

  // Sync fetched user with context
  useEffect(() => {
    if (fetchedUser) {
      // User was fetched, update context
      // (already done in query callback, but just for safety)
    }
  }, [fetchedUser]);

  // Setup callbacks for auth state changes
  useEffect(() => {
    let isHandling = false; // Prevent concurrent handling

    const handleSessionExpired = () => {
      // Skip if already handling session expiration
      if (isHandling) {
        console.log(
          "[AUTH] Session expired callback skipped - already handling"
        );
        return;
      }

      isHandling = true;
      console.log(
        "[AUTH] Session expired callback triggered - marking session expired"
      );
      // Only mark the session as expired here. Let the dedicated effect
      // that watches `isSessionExpired` perform the navigation. This
      // avoids race conditions or double-navigation attempts when the
      // callback is invoked from different places (interceptor, queries).
      setIsSessionExpired(true);
      queryClient.clear();
    };

    const handleSetRedirectReason = (
      reason?: "session-expired" | "session-invalid" | "user-deleted" | "error"
    ) => {
      console.log("[AUTH] Setting redirect reason", { reason });
      setRedirectReason(reason);
    };

    console.log("[AUTH] Setting up auth callbacks");
    setSessionExpiredCallback(handleSessionExpired);
    // setAuthLoadingCallback(handleSetAuthLoading); // Removed silent refresh loading
    setRedirectReasonCallback(handleSetRedirectReason);

    return () => {
      console.log("[AUTH] Cleaning up auth callbacks");
      setSessionExpiredCallback(() => {});
      setAuthLoadingCallback(() => {});
      setRedirectReasonCallback(() => {});
    };
  }, [queryClient, setIsSessionExpired, setRedirectReason]);

  // Handle session expiration state - HIGHEST PRIORITY
  useEffect(() => {
    if (isSessionExpired) {
      console.log(
        "[AUTH] Session expired state detected - clearing and redirecting"
      );
      // Clear everything immediately
      queryClient.clear();

      // Small delay to ensure UI updates before redirect
      // This prevents the blank page flicker
      const redirectTimer = setTimeout(() => {
        // Use hard navigation (window.location.href) to guarantee redirect
        // This is more reliable than router.replace() which can fail in edge cases
        console.log(
          "[AUTH] Executing redirect to login via window.location.href"
        );
        if (typeof window !== "undefined") {
          const loginUrl = getStoredLoginUrl();
          console.log("[AUTH] Session expired - redirecting to", loginUrl);
          window.location.href = loginUrl;
        }
      }, 50);

      return () => clearTimeout(redirectTimer);
    }
  }, [isSessionExpired, router, queryClient]);

  const isAuthenticated =
    !!user && !isSessionExpired && user.isSuspended === false;

  const isAdmin = user?.role === "admin" || false;

  return {
    // User data
    user: user || null,
    isAuthenticated,
    isAdmin,

    // Loading states
    isLoading: isLoading || isFetching,
    isAuthLoading: isFetching,
    isError,

    // Actions
    refetch,

    // Helper methods
    checkPermission: (permission: string): boolean => {
      if (!user) return false;
      return user.permissions?.includes(permission) ?? false;
    },

    checkRole: (role: string): boolean => {
      if (!user) return false;
      return user.role === role;
    },

    // Alias methods for permission checking (same as checkPermission)
    hasPermission: (permission: string): boolean => {
      if (!user) return false;
      return user.permissions?.includes(permission) ?? false;
    },

    hasAnyPermission: (permissions: string[]): boolean => {
      if (!user || !permissions.length) return false;
      return permissions.some(
        (permission) => user.permissions?.includes(permission) ?? false
      );
    },

    hasAllPermissions: (permissions: string[]): boolean => {
      if (!user || !permissions.length) return false;
      return permissions.every(
        (permission) => user.permissions?.includes(permission) ?? false
      );
    },
  };
}

// ============================================================================
// LOGIN HOOK
// ============================================================================

export function useLogin(expectedRole?: "user" | "admin") {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setIsLoading, setIsSessionExpired } = useAuthContext();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const user = response.data?.user;

      console.log("[AUTH] Login successful", {
        userId: user?.userId,
        role: user?.role,
      });

      // STRICT ROLE ENFORCEMENT
      if (expectedRole && user?.role) {
        // Allow "reseller" to login as "user" (they share the same dashboard)
        const isResellerLogin =
          expectedRole === "user" && user.role === "reseller";

        if (expectedRole !== user.role && !isResellerLogin) {
          console.warn(
            `[AUTH] Access Denied: Role mismatch. Expected ${expectedRole}, got ${user.role}`
          );

          // Immediately logout to clear the invalid session
          await authService.logout();

          const errorMsg =
            expectedRole === "admin"
              ? "Access Denied: You must login via the User Portal."
              : "Access Denied: Admins must login via the Admin Portal.";

          toast.error(errorMsg);
          setIsLoading(false);
          return; // Stop execution here
        }
      }

      toast.success("Login successful!", {
        description: `Welcome back, ${user?.fullName || "user"}! Redirecting to dashboard...`,
      });

      // Update auth context immediately
      setUser(user ?? null);

      // Reset session expiration flag since user just logged in
      setIsSessionExpired(false);

      // Don't set loading to false yet - let the query fetch handle it
      // The useCurrentUserQuery will set loading to false when data arrives

      // Invalidate user query to refetch fresh data
      await queryClient.invalidateQueries({
        queryKey: authKeys.currentUser(),
      });

      // Redirect logic:
      // 1. Admin -> /admin/dashboard
      // 2. User missing PIN -> /setup (Onboarding)
      // 3. User with PIN -> /dashboard
      // Use window.location.href for reliable redirect in production

      // IMPORTANT: Add small delay to ensure localStorage write completes
      // iOS Safari may not persist localStorage before page unload otherwise
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Check for returnUrl
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      const safeReturnUrl =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : null;

      if (user?.role === "admin") {
        console.log("[AUTH] Redirecting admin to dashboard");
        window.location.href = safeReturnUrl || "/admin/dashboard";
      } else if (!user?.hasPin) {
        // Check if we've already done setup on this device
        const isSetupDone =
          typeof window !== "undefined" &&
          localStorage.getItem("is_setup_done") === "true";

        if (isSetupDone) {
          console.log(
            "[AUTH] User missing PIN but setup done locally - redirecting to dashboard"
          );
          window.location.href = safeReturnUrl || "/dashboard";
        } else {
          console.log("[AUTH] User missing PIN - redirecting to setup");
          window.location.href = "/setup";
        }
      } else {
        console.log("[AUTH] Redirecting user to dashboard");
        window.location.href = safeReturnUrl || "/dashboard";
      }
    },

    onError: (error: AxiosError<any>) => {
      const errorMsg =
        error.response?.data?.message || "Login failed. Please try again.";
      // console.error("[AUTH] Login failed", { message: errorMsg });
      if (error.response?.data?.error === "2FA code is required") {
        console.log("[AUTH] 2FA required - transitioning to 2FA step");
        // setStep("2fa");
      } else if (
        errorMsg === "Account Update Required" ||
        errorMsg.toLowerCase().includes("invalid credentials") ||
        errorMsg.toLowerCase().includes("user not found") ||
        errorMsg.toLowerCase().includes("incorrect password")
      ) {
        // Skip toast for migration error as it's handled inline in the form
        console.log("[AUTH] Migration error detected - handled by UI");
      } else {
        toast.error(errorMsg);
      }
      setIsLoading(false);
    },
  });
}

// ============================================================================
// LOGOUT HOOK
// ============================================================================

// Track if a logout is already in progress to prevent duplicate calls
let isLoggingOut = false;

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, markSessionAsExpired } = useAuthContext();
  const [_, startTransition] = useTransition();

  // Determine the login URL IMMEDIATELY based on current user role
  // CRITICAL: Store this BEFORE mutation runs, because user becomes null during logout
  const loginUrl =
    user?.role === "admin" || user?.role === "staff"
      ? "/admin/login"
      : "/login";

  return useMutation({
    mutationFn: async () => {
      // Prevent concurrent logout attempts
      if (isLoggingOut) {
        console.warn(
          "[AUTH] Logout already in progress - skipping duplicate request"
        );
        throw new Error("Logout already in progress");
      }

      isLoggingOut = true;
      try {
        return await authService.logout();
      } finally {
        isLoggingOut = false;
      }
    },
    onSuccess: () => {
      console.log("[AUTH] Logout successful - redirecting to:", loginUrl);

      // Prevent browser from auto-filling credentials after explicit logout
      credentialManager.preventSilentAccess();

      // Clear all state immediately (don't wait for transition)
      markSessionAsExpired();
      queryClient.clear();

      // Use startTransition to prefetch the login page while clearing state
      startTransition(() => {
        // Prefetch the login page to prevent blank page flash
        router.prefetch(loginUrl);
      });

      // Redirect immediately without waiting for transitions
      // This prevents the blank page by navigating instantly
      if (typeof window !== "undefined") {
        window.location.href = loginUrl;
      }
    },

    onError: (error: any) => {
      console.error("[AUTH] Logout error", {
        message: error.message,
      });

      // Even if logout fails, clear local state and redirect immediately
      // Don't wait for animations or transitions
      markSessionAsExpired();
      queryClient.clear();

      if (typeof window !== "undefined") {
        window.location.href = loginUrl;
      }
    },
  });
}

// ============================================================================
// REGISTER HOOK
// ============================================================================

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setIsLoading, setIsSessionExpired } = useAuthContext();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: async (response) => {
      const user = response.data?.user;

      console.log("[AUTH] Registration successful", { userId: user?.userId });

      // Registration does NOT set auth cookies, so do NOT set user context or redirect to dashboard
      // Instead, redirect to login and show a success message
      toast.success("Registration successful! Please log in.");
      window.location.href = "/login?fromRegister=true";
    },

    onError: (error: AxiosError<any>) => {
      // Extract message from various possible error structures
      const errorData = error.response?.data;
      let errorMsg = "Registration failed. Please try again.";

      if (typeof errorData?.message === "string") {
        errorMsg = errorData.message;
      } else if (typeof errorData?.error === "string") {
        errorMsg = errorData.error;
      } else if (errorData?.error?.message) {
        errorMsg = errorData.error.message;
      } else if (
        Array.isArray(errorData?.errors) &&
        errorData.errors.length > 0
      ) {
        // Handle array of validation errors
        errorMsg = errorData.errors
          .map((e: any) => e.message || e.msg || e)
          .join(", ");
      }

      console.error("[AUTH] Registration failed", {
        message: errorMsg,
        rawError: errorData,
      });
      toast.error(errorMsg);
      setIsLoading(false);
    },
  });
}

// ============================================================================
// VERIFICATION HOOKS
// ============================================================================

export function useResendVerification() {
  return useMutation({
    mutationFn: ({
      email,
      returnUrl,
    }: {
      email: string;
      returnUrl?: string;
    }) => {
      // If no returnUrl provided, use current page path
      const url =
        returnUrl ||
        (typeof window !== "undefined" ? window.location.pathname : undefined);
      return authService.resendVerification(email, url);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Verification email sent successfully!");
    },
    onError: (error: AxiosError<any>) => {
      const errorMsg =
        error.response?.data?.message || "Failed to send verification email.";
      toast.error(errorMsg);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  // Get returnUrl from URL params if available
  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("returnUrl") || "/dashboard";
    }
    return "/dashboard";
  };

  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (data) => {
      toast.success(data.message || "Email verified successfully!");
      // Invalidate current user to refresh verified status
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      // Redirect to the original page or dashboard
      window.location.href = getReturnUrl();
    },
    onError: (error: AxiosError<any>) => {
      const errorMsg =
        error.response?.data?.message || "Email verification failed.";
      toast.error(errorMsg);
      window.location.href = "/login";
    },
  });
}
