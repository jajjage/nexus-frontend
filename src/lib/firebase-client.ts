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
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/dashboard/notifications/" }
    );
    console.log("Service Worker registered:", registration);
  } catch (err) {
    console.warn("Service Worker registration failed:", err);
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

    // Ensure service worker is registered before getting token
    const swRegistration = await navigator.serviceWorker.ready;
    console.log("Service worker ready, getting FCM token...");

    const currentToken = await getToken(messaging, {
      vapidKey: validVapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (currentToken) {
      console.log("FCM token obtained successfully");
      return currentToken;
    } else {
      console.warn("No FCM token received from Firebase");
      return null;
    }
  } catch (err) {
    console.error("Error getting FCM token:", err);
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
