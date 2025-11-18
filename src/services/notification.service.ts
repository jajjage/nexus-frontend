import apiClient from "@/lib/api-client";
import {
  registerServiceWorker,
  requestAndGetFcmToken,
} from "@/lib/firebase-client";

/**
 * Registers the FCM token with the backend after successful login
 * @param platform - Optional platform identifier (default: 'web')
 * @returns true if registration succeeded, false otherwise
 *
 * Note: The accessToken is automatically sent via HTTP-only cookie by apiClient,
 * so we don't need to pass it explicitly. The backend will authenticate the request
 * using the cookie.
 */
export async function registerFcmToken(
  platform: string = "web"
): Promise<boolean> {
  try {
    // First, register the service worker if not already done
    await registerServiceWorker();

    // Get the FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;
    const token = await requestAndGetFcmToken(vapidKey);
    console.log("Obtained FCM token:", token);

    if (!token) {
      console.warn("No FCM token available for registration");
      return false;
    }

    // Register the token with the backend using axios
    // The HTTP-only cookie is automatically sent by apiClient in the request
    const response = await apiClient.post("/notifications/tokens", {
      token,
      platform,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log("FCM token registered successfully");
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error registering FCM token:", err);
    return false;
  }
}

/**
 * Request user permission and register FCM token (for manual triggering)
 * Useful if you want to request permissions separately from login
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}
