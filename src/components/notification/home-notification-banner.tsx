"use client";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBanner } from "./notification-banner";

/**
 * HomeNotificationBanner Wrapper Component
 *
 * Handles data fetching and rendering of update/all category notifications
 * as a fixed banner on top of the page and dashboard.
 *
 * Features:
 * - Filters notifications by category: "updates" or "all"
 * - Dismisses locally without API calls
 * - No loading skeleton (banner only shows when data is ready)
 * - Only fetches when user is authenticated
 */
export function HomeNotificationBanner() {
  const { user } = useAuth();

  // Always call the hook (required by Rules of Hooks)
  // The enabled flag prevents API calls when user is not authenticated
  const { data, isLoading, error } = useNotifications(!!user);

  // If user not authenticated, don't show anything
  if (!user) {
    return null;
  }

  // Combine verification banner with notifications
  return (
    <>
      {/* TODO: Re-enable verification banner when verification flow is ready
      <VerificationBanner />
      */}
      {!isLoading && !error && data?.data?.notifications && (
        <NotificationBanner
          notifications={data.data.notifications.filter(
            (notif) =>
              notif.notification.category === "updates" ||
              notif.notification.category === "all"
          )}
        />
      )}
    </>
  );
}
