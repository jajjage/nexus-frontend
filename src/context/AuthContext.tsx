"use client";

import { User } from "@/types/api.types";
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Authentication State Context
 *
 * This context manages the global authentication state including:
 * - User profile information
 * - Session validity
 * - Token refresh attempts tracking
 * - Session expiration flag
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

  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSessionExpired: (expired: boolean) => void;
  markSessionAsExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

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
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error("Failed to parse cached user:", e);
        localStorage.removeItem("auth_user_cache");
      }
    }

    setIsLoading(false);
  }, []);

  const markSessionAsExpired = () => {
    setIsSessionExpired(true);
    setUser(null);
    localStorage.removeItem("auth_user_cache");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !isSessionExpired,
    isSessionExpired,
    hasRefreshTokens,
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        // Cache user for 5 minutes
        localStorage.setItem("auth_user_cache", JSON.stringify(newUser));
        localStorage.setItem("auth_user_cache_time", Date.now().toString());
      }
    },
    setIsLoading,
    setIsSessionExpired,
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
