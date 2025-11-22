"use client";

import { getApps, initializeApp } from "firebase/app";
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
      { scope: "/" }
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

  // Always request notification permission before getting token
  let permission = Notification.permission;
  if (permission !== "granted") {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.warn("Notification permission request failed:", err);
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
    const currentToken = await getToken(messaging, {
      vapidKey: validVapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    return currentToken || null;
  } catch (err) {
    console.warn("Error getting FCM token:", err);
    return null;
  }
}

// Kept for backward compatibility
export async function getFcmToken(vapidKey?: string | null) {
  return requestAndGetFcmToken(vapidKey);
}

export { onMessage };
