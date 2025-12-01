// hooks/useForegroundNotifications.ts
"use client";

import { getFirebaseApp } from "@/lib/firebase-client";
import { getMessaging, onMessage } from "firebase/messaging";
import { useEffect } from "react";
import { toast } from "sonner";

export function useForegroundNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // 1. Get the app instance
    const app = getFirebaseApp();
    if (!app) return; // Guard clause in case init failed

    try {
      const messaging = getMessaging(app);

      // 2. Listen for messages while app is open
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);

        // Show the toast
        toast(payload.notification?.body || "New Notification", {
          duration: 5000,
          position: "top-right",
          icon: "🔔",
        });
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up foreground listener:", error);
    }
  }, []);
}
