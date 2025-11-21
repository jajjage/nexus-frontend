"use client";

import { syncFcmToken } from "@/services/notification.service";
import { useEffect } from "react";
import { useAuth } from "./useAuth";

/**
 * Hook to sync FCM token when app opens (if user is already logged in)
 * This ensures token hasn't expired/refreshed and device is properly linked
 *
 * Usage:
 * Call this hook in your root layout or main app component
 * It will automatically sync the token when the app mounts if user is authenticated
 *
 * Example:
 * export function RootLayout({ children }) {
 *   useSyncFcmOnMount();
 *   return <>{children}</>;
 * }
 */
export function useSyncFcmOnMount() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only sync if user is authenticated and auth is not loading
    // Note: isAuthenticated checks both that user exists AND is not suspended
    if (!isLoading && isAuthenticated) {
      console.log("User authenticated on app mount, syncing FCM token");

      // Sync FCM token (fire-and-forget)
      // This checks localStorage to see if token is already synced
      // If it is, the API call is skipped
      syncFcmToken("web").catch((err: Error) => {
        console.warn("FCM token sync on app mount failed (non-blocking):", err);
      });
    }
  }, [isLoading, isAuthenticated]);
}
