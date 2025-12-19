"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

/**
 * useSessionRevalidation Hook
 *
 * Monitors for app focus/wake from sleep and triggers session revalidation
 * This handles scenarios where:
 * - User puts PC/device to sleep
 * - Returns to the app after some time
 * - Backend may have gone down temporarily
 * - Network connection was lost
 *
 * When these events are detected:
 * 1. Set global loading state to "revalidating"
 * 2. Let the next API request attempt token refresh
 * 3. If refresh succeeds, app continues normally
 * 4. If refresh fails, redirect to login with clear message
 */
export function useSessionRevalidation() {
  const { setIsAuthLoadingGlobal, setRedirectReason } = useAuthContext();
  let pageHiddenTime: number | null = null;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (user minimized window, went to another tab, etc.)
        pageHiddenTime = Date.now();
        console.log(
          "[SESSION] Page hidden at",
          new Date(pageHiddenTime).toISOString()
        );
      } else {
        // Page is visible again
        const timeHidden = pageHiddenTime ? Date.now() - pageHiddenTime : 0;
        const threshold = 2 * 60 * 1000; // 2 minutes

        console.log("[SESSION] Page visible again after", timeHidden, "ms");

        // If hidden for more than 2 minutes, likely sleep or network issue
        if (timeHidden > threshold) {
          console.log(
            "[SESSION] Detected potential sleep/network issue - revalidating session"
          );
          // Trigger session revalidation
          setIsAuthLoadingGlobal(true, "revalidating");

          // Set a timeout to clear the loading state if it takes too long
          const clearLoadingTimeout = setTimeout(() => {
            console.log(
              "[SESSION] Revalidation timeout - clearing loading state"
            );
            setIsAuthLoadingGlobal(false);
            setRedirectReason("error");
          }, 10000); // 10 seconds

          return () => clearTimeout(clearLoadingTimeout);
        }
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also listen for focus events (for alt+tab, window restore, etc.)
    const handleFocus = () => {
      if (pageHiddenTime) {
        const timeHidden = Date.now() - pageHiddenTime;
        const threshold = 2 * 60 * 1000; // 2 minutes

        if (timeHidden > threshold) {
          console.log(
            "[SESSION] Focus regained after potential sleep - revalidating"
          );
          setIsAuthLoadingGlobal(true, "revalidating");

          const clearLoadingTimeout = setTimeout(() => {
            setIsAuthLoadingGlobal(false);
            setRedirectReason("error");
          }, 10000);

          return () => clearTimeout(clearLoadingTimeout);
        }
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [setIsAuthLoadingGlobal, setRedirectReason]);
}
