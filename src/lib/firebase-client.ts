"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if config is valid (all required fields present)
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

let firebaseInitialized = false;

// Initialize Firebase only once if config is valid
if (
  typeof window !== "undefined" &&
  !getApps().length &&
  isFirebaseConfigValid()
) {
  try {
    initializeApp(firebaseConfig);
    firebaseInitialized = true;
  } catch (err) {
    console.warn("Firebase init error:", err);
    firebaseInitialized = false;
  }
}

// Register the service worker for background message handling
export async function registerServiceWorker() {
  if (typeof window === "undefined") return;

  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported in this browser");
    return;
  }

  try {
    // For localhost development, use HTTP protocol if available
    const swUrl =
      window.location.protocol === "https:" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
        ? "/firebase-messaging-sw.js"
        : "/firebase-messaging-sw.js";

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: "/",
    });
    console.log("Service Worker registered:", registration);

    // Handle waiting service worker - skip waiting and activate new one
    if (registration.waiting) {
      console.log(
        "[SW] Waiting service worker found, activating new version..."
      );
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Listen for new service workers and activate them
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[SW] New service worker installed, activating...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    });
  } catch (err: any) {
    console.warn("Service Worker registration failed:", err);

    // Provide helpful debug info for localhost HTTPS issues
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      if (window.location.protocol === "https:") {
        console.warn(
          "⚠️ Local development with HTTPS detected. Service Worker registration failed due to SSL certificate."
        );
        console.warn(
          "Solution: Either run on HTTP (recommended for dev) or use mkcert to create trusted local certs."
        );
        console.warn(
          "For now, FCM notifications will not work in the background."
        );
      }
    }
  }
}

export async function requestAndGetFcmToken(vapidKey?: string | null) {
  if (typeof window === "undefined") return null;

  // Return null if Firebase isn't properly initialized
  if (!firebaseInitialized) {
    console.warn(
      "Firebase not initialized. Missing NEXT_PUBLIC_FIREBASE_* env vars."
    );
    return null;
  }

  // Check notification support
  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser");
    return null;
  }

  // Always request notification permission before getting token
  let permission = Notification.permission;
  if (permission !== "granted") {
    try {
      console.log("Requesting notification permission...");
      permission = await Notification.requestPermission();
      console.log("Permission response:", permission);
    } catch (err) {
      console.error("Notification permission request failed:", err);
      return null;
    }
  }

  if (permission !== "granted") {
    console.warn("Notification permission not granted. Cannot get FCM token.");
    return null;
  }

  try {
    const messaging = getMessaging();
    const validVapidKey = vapidKey ?? undefined;

    console.log("Waiting for service worker...");

    // Ensure service worker is registered before getting token
    const swRegistration = await navigator.serviceWorker.ready;
    console.log("Service worker ready, SW details:", {
      scope: swRegistration.scope,
      active: !!swRegistration.active,
    });

    console.log(
      "Getting FCM token with VAPID key:",
      validVapidKey ? "provided" : "not provided"
    );

    // Retry logic for token request
    let currentToken = null;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[Attempt ${attempt}/${maxRetries}] Requesting FCM token...`
        );

        const tokenPromise = getToken(messaging, {
          vapidKey: validVapidKey,
          serviceWorkerRegistration: swRegistration,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`Token request timeout (${attempt}/${maxRetries})`)
              ),
            15000
          )
        );

        currentToken = await Promise.race([tokenPromise, timeoutPromise]);

        if (currentToken) {
          console.log("FCM token obtained successfully on attempt", attempt);
          return currentToken;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries failed
    if (!currentToken) {
      console.error(
        "Failed to get FCM token after all retries. Last error:",
        lastError?.message
      );
      return null;
    }

    return currentToken;
  } catch (err) {
    console.error("Error in FCM token request:", err);
    if (err instanceof Error) {
      console.error("Error details:", err.message);
    }
    return null;
  }
}

// Add this export at the bottom of the file
export function getFirebaseApp() {
  if (typeof window === "undefined") return null;

  // If initialized, return the default app
  if (getApps().length > 0) {
    return getApp();
  }

  // Fallback: If for some reason it wasn't init'd yet, init it now
  if (isFirebaseConfigValid()) {
    return initializeApp(firebaseConfig);
  }

  return null;
}

// Kept for backward compatibility
export async function getFcmToken(vapidKey?: string | null) {
  return requestAndGetFcmToken(vapidKey);
}

export { onMessage };
