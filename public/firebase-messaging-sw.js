// Bootstrap service worker: Firebase configuration
// This file contains inline Firebase imports and background message handling
// All configuration is injected at build/deployment time

importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Configuration will be set via postMessage from the main app
let messaging = null;
let isInitialized = false;

// Listen for initialization message from the main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "INIT_FIREBASE") {
    const firebaseConfig = event.data.firebaseConfig;

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      messaging = firebase.messaging();
      isInitialized = true;
      console.log("[SW] Firebase initialized via postMessage");

      // Set up background message handler AFTER Firebase is initialized
      try {
        messaging.onBackgroundMessage((payload) => {
          console.log("[SW] ========== BACKGROUND MESSAGE RECEIVED ==========");
          console.log("[SW] Background message received:", payload);
          console.log("[SW] Notification object:", payload.notification);
          console.log("[SW] Data object:", payload.data);

          const notificationTitle =
            payload.notification?.title || "New Message";
          const notificationId = payload.data?.notificationId || "";

          console.log("[SW] Notification ID:", notificationId);
          console.log(
            "[SW] Showing notification with title:",
            notificationTitle
          );

          const notificationOptions = {
            body: payload.notification?.body || "You have a new notification",
            icon:
              payload.notification?.image || "/images/notification-icon.png",
            badge: "/images/notification-badge.png",
            click_action: payload.fcmOptions?.link || "/",
            tag: notificationId || "notification",
            requireInteraction: false,
            data: {
              notificationId: notificationId,
              ...payload.data,
            },
          };

          console.log("[SW] Full notification options:", notificationOptions);

          try {
            self.registration.showNotification(
              notificationTitle,
              notificationOptions
            );
            console.log(
              "[SW] Notification shown successfully for ID:",
              notificationId
            );
          } catch (error) {
            console.error("[SW] Failed to show notification:", error);
          }
        });
        console.log("[SW] onBackgroundMessage handler set up successfully");
      } catch (error) {
        console.error("[SW] Error setting up onBackgroundMessage:", error);
      }
    } catch (error) {
      console.error("[SW] Firebase initialization error:", error);
    }
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification);
  console.log(
    "[SW] Full notification data:",
    JSON.stringify(event.notification.data)
  );
  event.notification.close();

  const notificationId = event.notification.data?.notificationId;
  const transactionId = event.notification.data?.transactionId;
  let urlToOpen = "/dashboard";

  console.log("[SW] Extracted notificationId:", notificationId);
  console.log("[SW] Extracted transactionId:", transactionId);

  // If notificationId exists, navigate to notifications page
  if (notificationId) {
    urlToOpen = "/dashboard/notifications/";
  }
  // If only transactionId exists, navigate to transaction detail page
  else if (transactionId) {
    urlToOpen = "/dashboard/transactions/" + transactionId;
  }

  console.log("[SW] Opening URL:", urlToOpen);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        console.log("[SW] Found", clientList.length, "open clients");

        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          console.log("[SW] Checking client:", client.url);

          if (client.url.includes(self.location.origin)) {
            console.log("[SW] Found matching client, navigating...");

            if ("focus" in client) {
              client.focus();
            }

            // Send navigation message to the client
            client.postMessage({
              type: "navigate",
              url: urlToOpen,
              notificationId: notificationId,
              transactionId: transactionId,
            });
            console.log("[SW] Sent navigation message to client");
            return;
          }
        }

        console.log("[SW] No existing client found, opening new window");
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((err) => {
        console.error("[SW] Error handling notification click:", err);
      })
  );
});
