"use client";

import { User } from "@/types/api.types";
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Authentication State Context
 *
 * This context manages the global authentication state including:
 * - User profile information
 * - Session validity and revalidation
 * - Global auth loading states (for post-sleep recovery)
 * - Redirect reason (why user is being redirected to login)
 *
 * This is the single source of truth for auth state across the application.
 */

interface AuthContextType {
  // User data
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Session state
  isSessionExpired: boolean;
  hasRefreshTokens: boolean;

  // Global auth loading state (shown during recovery, revalidation, or redirect)
  isAuthLoadingGlobal: boolean;
  authLoadingReason?: "revalidating" | "redirecting" | "recovering";

  // Redirect reason
  redirectReason?:
    | "session-expired"
    | "session-invalid"
    | "user-deleted"
    | "error";

  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSessionExpired: (expired: boolean) => void;
  setIsAuthLoadingGlobal: (
    loading: boolean,
    reason?: "revalidating" | "redirecting" | "recovering"
  ) => void;
  setRedirectReason: (
    reason?: "session-expired" | "session-invalid" | "user-deleted" | "error"
  ) => void;
  markSessionAsExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isAuthLoadingGlobal, setIsAuthLoadingGlobalState] = useState(false);
  const [authLoadingReason, setAuthLoadingReason] = useState<
    "revalidating" | "redirecting" | "recovering"
  >();
  const [redirectReason, setRedirectReasonState] = useState<
    "session-expired" | "session-invalid" | "user-deleted" | "error"
  >();

  // Check if user has refresh tokens on mount
  const [hasRefreshTokens, setHasRefreshTokens] = useState(false);

  useEffect(() => {
    // Check if refresh token exists in cookies
    const hasRefreshToken = document.cookie.includes("refreshToken");
    setHasRefreshTokens(hasRefreshToken);

    // Initialize auth state from localStorage if available
    const cachedUser = localStorage.getItem("auth_user_cache");
    if (cachedUser) {
      try {
        setUserState(JSON.parse(cachedUser));
      } catch (e) {
        console.error("Failed to parse cached user:", e);
        localStorage.removeItem("auth_user_cache");
      }
    }

    setIsLoading(false);
  }, []);

  const markSessionAsExpired = () => {
    setIsSessionExpired(true);
    setUserState(null);
    localStorage.removeItem("auth_user_cache");
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // Cache user for 5 minutes
      localStorage.setItem("auth_user_cache", JSON.stringify(newUser));
      localStorage.setItem("auth_user_cache_time", Date.now().toString());
    }
  };

  const setIsAuthLoadingGlobal = (
    loading: boolean,
    reason?: "revalidating" | "redirecting" | "recovering"
  ) => {
    setIsAuthLoadingGlobalState(loading);
    if (loading && reason) {
      setAuthLoadingReason(reason);
    } else {
      setAuthLoadingReason(undefined);
    }
  };

  const setRedirectReason = (
    reason?: "session-expired" | "session-invalid" | "user-deleted" | "error"
  ) => {
    setRedirectReasonState(reason);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !isSessionExpired,
    isSessionExpired,
    hasRefreshTokens,
    isAuthLoadingGlobal,
    authLoadingReason,
    redirectReason,
    setUser,
    setIsLoading,
    setIsSessionExpired,
    setIsAuthLoadingGlobal,
    setRedirectReason,
    markSessionAsExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
