"use client";

import { Notification } from "@/types/notification.types";
import { AlertCircle, Bell, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationBannerProps {
  notifications: Notification[];
  onDismiss?: (notificationId: string) => void;
}

/**
 * NotificationBanner Component
 *
 * Displays notifications with category "updates" or "all" as a fixed banner on top of the page.
 * User can dismiss by clicking the X button.
 *
 * Design:
 * - Fixed positioned banner that appears on top without pushing content
 * - Color-coded by notification type (info, success, warning, error, alert)
 * - Smooth fade/slide animations for appearance and disappearance
 * - Dismiss only removes from UI locally, persists in localStorage
 * - NO API calls when dismissing - only local state
 */
export function NotificationBanner({
  notifications,
  onDismiss,
}: NotificationBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [visibleNotification, setVisibleNotification] =
    useState<Notification | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    const storedDismissed = localStorage.getItem(
      "notification_banner_dismissed"
    );
    if (storedDismissed) {
      try {
        const parsed = JSON.parse(storedDismissed);
        // Ensure it's an array (iterable) before creating Set
        if (Array.isArray(parsed)) {
          setDismissedIds(new Set(parsed));
        } else {
          // If stored data is invalid (e.g., boolean true from old code), reset it
          console.warn(
            "Invalid dismissed notifications format in localStorage, resetting."
          );
          setDismissedIds(new Set());
          localStorage.removeItem("notification_banner_dismissed");
        }
      } catch (e) {
        console.error("Failed to parse dismissed notifications:", e);
        // Fallback to empty set
        setDismissedIds(new Set());
      }
    }
  }, []);

  // Filter notifications by category and get first active one
  useEffect(() => {
    const filteredNotifications = notifications.filter(
      (notif) =>
        (notif.notification.category === "updates" ||
          notif.notification.category === "all") &&
        !dismissedIds.has(notif.id)
    );

    setVisibleNotification(filteredNotifications[0] || null);
  }, [notifications, dismissedIds]);

  const handleDismiss = () => {
    if (!visibleNotification) return;

    setIsHiding(true);
    // Wait for animation to complete before hiding from DOM
    setTimeout(() => {
      const newDismissedIds = new Set([
        ...dismissedIds,
        visibleNotification.id,
      ]);
      setDismissedIds(newDismissedIds);

      // Persist to localStorage so dismissal persists across page refreshes
      localStorage.setItem(
        "notification_banner_dismissed",
        JSON.stringify(Array.from(newDismissedIds))
      );

      setIsHiding(false);
    }, 300);
  };

  // Get colors based on notification type
  const getNotificationStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          iconColor: "text-emerald-600",
          titleColor: "text-emerald-900",
          descColor: "text-emerald-700",
          icon: <CheckCircle2 className="h-5 w-5" />,
        };
      case "warning":
        return {
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          iconColor: "text-amber-600",
          titleColor: "text-amber-900",
          descColor: "text-amber-700",
          icon: <AlertCircle className="h-5 w-5" />,
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-900",
          descColor: "text-red-700",
          icon: <AlertCircle className="h-5 w-5" />,
        };
      case "alert":
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          titleColor: "text-orange-900",
          descColor: "text-orange-700",
          icon: <Bell className="h-5 w-5" />,
        };
      case "info":
      default:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
          descColor: "text-blue-700",
          icon: <Info className="h-5 w-5" />,
        };
    }
  };

  if (!visibleNotification || isHiding) {
    return null;
  }

  const styles = getNotificationStyles(visibleNotification.notification.type);
  const notificationData = visibleNotification.notification;

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 fixed top-0 right-0 left-0 z-50 duration-300`}
      role="alert"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`${styles.bgColor} ${styles.borderColor} rounded-b-lg border border-t-0 p-4`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
              {styles.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-semibold ${styles.titleColor}`}>
                {notificationData.title}
              </h3>
              {notificationData.body && (
                <p className={`mt-1 text-sm ${styles.descColor}`}>
                  {notificationData.body}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className={`shrink-0 ${styles.iconColor} transition-all duration-300 hover:opacity-70 active:scale-95`}
              aria-label="Dismiss notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
