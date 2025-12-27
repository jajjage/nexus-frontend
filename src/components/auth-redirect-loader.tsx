"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useEffect, useState } from "react";

/**
 * AuthRedirectLoader
 *
 * This component displays context-aware loading states during:
 * 1. Session revalidation after sleep/network error
 * 2. Session expiration before redirect to login
 * 3. Session recovery attempts
 *
 * This prevents blank pages and provides clear feedback to users.
 */
export function AuthRedirectLoader() {
  const {
    isSessionExpired,
    isAuthLoadingGlobal,
    authLoadingReason,
    redirectReason,
  } = useAuthContext();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Show loader if:
    // 1. Session is expired (redirect in progress), OR
    // 2. Global auth loading is active
    if (isSessionExpired || isAuthLoadingGlobal) {
      const timer = setTimeout(() => {
        setShowLoader(true);
      }, 100); // Small delay to avoid flicker for fast redirects

      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isSessionExpired, isAuthLoadingGlobal]);

  if (!showLoader) {
    return null;
  }

  // Determine the message based on the reason
  let message = "Verifying session...";
  let description = "";

  if (authLoadingReason === "revalidating") {
    message = "Revalidating session...";
    description = "Please wait while we verify your session";
  } else if (authLoadingReason === "recovering") {
    message = "Recovering session...";
    description = "Your connection was lost. Reconnecting...";
  } else if (authLoadingReason === "redirecting" || isSessionExpired) {
    message = "Session Expired";
    description = "Redirecting to login...";

    if (redirectReason === "session-expired") {
      description = "Your session has expired. Redirecting to login...";
    } else if (redirectReason === "session-invalid") {
      description = "Your session is invalid. Redirecting to login...";
    } else if (redirectReason === "user-deleted") {
      description = "Your account has been deleted. Redirecting to login...";
    } else if (redirectReason === "error") {
      description = "An authentication error occurred. Redirecting to login...";
    }
  }

  return (
    <div className="bg-background/95 fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center space-y-8 p-6">
        {/* Animated loading skeleton */}
        <div className="flex flex-col items-center space-y-6">
          <div className="animate-pulse space-y-4 text-center">
            <div className="bg-primary/20 ring-primary/10 mx-auto h-16 w-16 rounded-full ring-4" />
            <div className="space-y-3">
              <div className="bg-muted mx-auto h-4 w-48 rounded-full" />
              <div className="bg-muted/60 mx-auto h-3 w-36 rounded-full" />
            </div>
          </div>
        </div>

        <div className="max-w-xs space-y-2 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {message}
          </h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Subtle loading indicator */}
        <div className="flex gap-1.5">
          <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full" />
        </div>
      </div>
    </div>
  );
}
