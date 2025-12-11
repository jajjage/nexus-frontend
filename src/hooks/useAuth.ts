"use client";

import { useAuthContext } from "@/context/AuthContext";
import { setSessionExpiredCallback } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
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
const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// ============================================================================
// FETCH CURRENT USER - REACT QUERY
// ============================================================================

/**
 * Fetch user profile from server
 *
 * Strategy:
 * - Runs once on component mount
 * - Result cached for 5 minutes
 * - No automatic refetch unless explicitly triggered
 * - Updates AuthContext on success
 */
function useCurrentUserQuery() {
  const { setUser, setIsLoading, markSessionAsExpired, setIsSessionExpired } =
    useAuthContext();
  const router = useRouter();

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
    retry: 0, // Don't retry here - let axios interceptor handle it
    enabled: true, // Always enabled, but checks cache first
  });

  // Handle success - update context when user data is fetched
  useEffect(() => {
    if (query.data !== undefined && query.isSuccess) {
      console.log("[AUTH] User profile updated in context", {
        userId: query.data?.userId,
      });
      setUser(query.data);
      setIsLoading(false);
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
      if (
        status === 401 ||
        status === 400 ||
        status === 403 ||
        status === 404
      ) {
        console.error(
          "[AUTH] Auth error detected in query - marking session as expired",
          { status }
        );
        // Call markSessionAsExpired which updates context AND also call setIsSessionExpired
        markSessionAsExpired();
        setIsSessionExpired(true); // Ensure the context state is also updated

        // For 404 (user deleted), immediately trigger redirect
        if (status === 404) {
          toast.error("Sorry ", {
            description: "You can try login again",
          });
          console.error(
            "[AUTH] User not found (404) - forcing immediate redirect"
          );
          // Force immediate redirect without waiting for effect
          setTimeout(() => {
            console.log("[AUTH] Executing immediate 404 redirect");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  isLoading: boolean;
  isAuthLoading: boolean;
  isError: boolean;
  refetch: () => void;
  checkPermission: (permission: string) => boolean;
  checkRole: (role: string) => boolean;
} {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading, isSessionExpired, setIsSessionExpired } =
    useAuthContext();

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

  // Setup callback for when session expires
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

    console.log("[AUTH] Setting up session expired callback");
    setSessionExpiredCallback(handleSessionExpired);

    return () => {
      console.log("[AUTH] Cleaning up session expired callback");
      // pass a no-op so the callback type () => void is satisfied
      setSessionExpiredCallback(() => {});
    };
  }, [router, queryClient, setIsSessionExpired]);

  // Handle session expiration state - HIGHEST PRIORITY
  useEffect(() => {
    if (isSessionExpired) {
      console.log(
        "[AUTH] Session expired state detected - clearing and redirecting"
      );
      // Clear everything immediately
      queryClient.clear();

      // Use hard navigation (window.location.href) to guarantee redirect
      // This is more reliable than router.replace() which can fail in edge cases
      console.log("[AUTH] Redirecting to login via window.location.href");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }
  }, [isSessionExpired, router, queryClient]);

  const isAuthenticated =
    !!user && !isSessionExpired && user.isSuspended === false;

  return {
    // User data
    user: user || null,
    isAuthenticated,

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
  };
}

// ============================================================================
// LOGIN HOOK
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setIsLoading, setIsSessionExpired } = useAuthContext();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const user = response.data?.user;

      toast.success("Login successful!", {
        description: `Welcome back, ${user?.fullName || "user"}! Redirecting to dashboard...`,
      });
      console.log("[AUTH] Login successful", { userId: user?.userId });

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

      // Redirect based on role
      const redirectPath =
        user?.role === "admin" ? "/admin/dashboard" : "/dashboard";
      router.push(redirectPath);
    },

    onError: (error: AxiosError<any>) => {
      const errorMsg =
        error.response?.data?.message || "Login failed. Please try again.";
      console.error("[AUTH] Login failed", { message: errorMsg });
      toast.error(errorMsg);
      setIsLoading(false);
    },
  });
}

// ============================================================================
// LOGOUT HOOK
// ============================================================================

// Track if a logout is already in progress to prevent duplicate calls
let isLoggingOut = false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { markSessionAsExpired } = useAuthContext();
  const [_, startTransition] = useTransition();

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
      console.log("[AUTH] Logout successful");

      // Clear all state immediately (don't wait for transition)
      markSessionAsExpired();
      queryClient.clear();

      // Use startTransition to prefetch the login page while clearing state
      startTransition(() => {
        // Prefetch the login page to prevent blank page flash
        router.prefetch("/login");
      });

      // Redirect immediately without waiting for transitions
      // This prevents the blank page by navigating instantly
      if (typeof window !== "undefined") {
        window.location.href = "/login";
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
        window.location.href = "/login";
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
      router.push("/login");
    },

    onError: (error: AxiosError<any>) => {
      const errorMsg =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      console.error("[AUTH] Registration failed", { message: errorMsg });
      toast.error(errorMsg);
      setIsLoading(false);
    },
  });
}
