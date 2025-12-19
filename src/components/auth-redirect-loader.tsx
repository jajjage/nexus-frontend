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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="space-y-4 text-center">
        {/* Animated loading skeleton */}
        <div className="inline-block">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="mx-auto h-4 w-40 rounded bg-gray-200" />
              <div className="mx-auto h-3 w-32 rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <p className="min-h-6 text-base font-medium text-gray-700">{message}</p>
        <p className="min-h-5 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
