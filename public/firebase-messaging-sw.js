// Service Worker with PWA offline support and Firebase Cloud Messaging
const CACHE_NAME = "nexus-data-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/images/logo.svg"];

// Immediately activate this service worker when installed
self.addEventListener("install", (event) => {
  console.log("[SW] Service worker installing");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn("[SW] Error caching some assets:", error);
        // Don't fail installation if some assets fail to cache
        // Continue even if optional assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Claim clients when activated
self.addEventListener("activate", (event) => {
  console.log("[SW] Service worker activating");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// NOTE: fetch handler intentionally removed to avoid performance/navigation
// overhead and the "no-op fetch handler" warning from audits. This service
// worker now only handles push/notification events. If you need offline
// caching in future, re-introduce a focused fetch handler that only
// intercepts specific requests (e.g. navigation or well-scoped assets).

// Try to load Firebase scripts for token generation
// If CDN fails, we'll still handle push events
let firebaseLoaded = false;

// Try multiple CDN sources
const firebaseScripts = [
  {
    app: "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
    messaging:
      "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js",
  },
  {
    app: "https://cdn.jsdelivr.net/npm/firebase@9.23.0/firebase-app-compat.js",
    messaging:
      "https://cdn.jsdelivr.net/npm/firebase@9.23.0/firebase-messaging-compat.js",
  },
];

for (const scripts of firebaseScripts) {
  try {
    console.log(`[SW] Attempting to load Firebase from: ${scripts.app}`);
    importScripts(scripts.app, scripts.messaging);
    firebaseLoaded = true;
    console.log("[SW] Firebase scripts loaded successfully");
    break;
  } catch (error) {
    console.warn(`[SW] Failed to load from ${scripts.app}:`, error.message);
  }
}

if (!firebaseLoaded) {
  console.warn(
    "[SW] Could not load Firebase from any CDN, will use push event handler only"
  );
}

// Handle push notifications from Firebase Cloud Messaging
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received");

  if (!event.data) {
    console.log("[SW] No data in push event");
    return;
  }

  try {
    const payload = event.data.json();
    console.log("[SW] FCM Payload:", payload);

    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationBody = payload.notification?.body || "";
    const notificationId = payload.data?.notificationId || "";
    const transactionId = payload.data?.transactionId || "";

    console.log("[SW] Notification ID:", notificationId);
    console.log("[SW] Transaction ID:", transactionId);

    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.image || "/images/adaptive-icon.png",
      badge: "/res/drawable-xxxhdpi/ic_notification.png", // Monochrome icon for Android status bar
      tag: notificationId || "notification",
      requireInteraction: false,
      data: {
        notificationId: notificationId,
        transactionId: transactionId,
        ...payload.data,
      },
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
    console.log("[SW] Notification shown successfully");
  } catch (error) {
    console.error("[SW] Error handling push:", error);
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);
});

// Handle notification click
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
