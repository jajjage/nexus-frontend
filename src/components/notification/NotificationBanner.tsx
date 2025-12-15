"use client";

import {
  areNotificationsEnabled,
  requestNotificationPermission,
  syncFcmToken,
} from "@/services/notification.service"; // Adjust import path to your frontend file
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const NOTIFICATION_BANNER_DISMISSED_KEY = "notification_banner_dismissed";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Debug: Check permission status
    if (typeof window !== "undefined" && "Notification" in window) {
      console.log(
        "[NotificationBanner] Current permission:",
        Notification.permission
      );
    }

    // Check if user has previously dismissed the banner
    const isDismissed = localStorage.getItem(NOTIFICATION_BANNER_DISMISSED_KEY);

    // Only show if notifications are NOT enabled yet
    // and if the browser actually supports them
    // and if the user hasn't dismissed the banner
    if (
      "Notification" in window &&
      !areNotificationsEnabled() &&
      !isDismissed
    ) {
      console.log(
        "[NotificationBanner] Showing banner (permission not granted)"
      );
      setIsVisible(true);
    } else {
      console.log(
        "[NotificationBanner] Hiding banner (permission already granted or not supported or dismissed)"
      );
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await syncFcmToken("web");
      setIsVisible(false); // Hide banner on success
    } else {
      alert(
        "Please enable notifications in your browser settings to continue."
      );
    }
  };

  const handleDismiss = () => {
    // Store dismissal in localStorage so it doesn't show again
    localStorage.setItem(NOTIFICATION_BANNER_DISMISSED_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded border-l-4 border-blue-500 bg-blue-50 p-4 shadow-sm">
      <div className="flex-1">
        <h3 className="font-semibold text-blue-800">Don't miss updates</h3>
        <p className="text-sm text-blue-700">
          Enable push notifications to get real-time alerts on your device.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnable}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Enable Notifications
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md p-2 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
          title="Dismiss notification"
          aria-label="Dismiss notification banner"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
