"use client";

import {
  areNotificationsEnabled,
  requestNotificationPermission,
  syncFcmToken,
} from "@/services/notification.service";
import { useEffect, useState } from "react";

export default function NotificationPermissionButton() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(areNotificationsEnabled());
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setEnabled(true);
      // Immediately sync token now that we have permission
      await syncFcmToken("web");
      alert("Notifications enabled!");
    } else {
      alert("Permission denied. Please enable in browser settings.");
    }
  };

  if (enabled) return <p className="text-green-500">✅ Notifications Active</p>;

  return (
    <button onClick={handleEnable} className="btn-primary">
      Enable Push Notifications
    </button>
  );
}
