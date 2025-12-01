"use client";

import {
  areNotificationsEnabled,
  requestNotificationPermission,
  syncFcmToken,
} from "@/services/notification.service"; // Adjust import path to your frontend file
import { useEffect, useState } from "react";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if notifications are NOT enabled yet
    // and if the browser actually supports them
    if ("Notification" in window && !areNotificationsEnabled()) {
      setIsVisible(true);
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

  if (!isVisible) return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded border-l-4 border-blue-500 bg-blue-50 p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-blue-800">Don't miss updates</h3>
        <p className="text-sm text-blue-700">
          Enable push notifications to get real-time alerts on your device.
        </p>
      </div>
      <button
        onClick={handleEnable}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Enable Notifications
      </button>
    </div>
  );
}
