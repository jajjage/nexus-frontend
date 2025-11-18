// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging
// This file handles background messages and push notifications

importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Initialize firebase app with the same config used client-side
// Note: This config is public (NEXT_PUBLIC_* vars) so it's safe to include here
firebase.initializeApp({
  apiKey: "AIzaSyBNPBCS-IyOcQstSckLUtVNdfDpha5Bz3U",
  authDomain: "nexus-1837e.firebaseapp.com",
  projectId: "nexus-1837e",
  messagingSenderId: "884447303295",
  appId: "1:884447303295:web:81a0a7d45b2a5fa9b8d14a",
});

const messaging = firebase.messaging();

// Handle background messages
// This handler is called when a message is received while the app is in the background
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Message";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: payload.notification?.image || "/images/notification-icon.png",
    badge: "/images/notification-badge.png",
    click_action: payload.fcmOptions?.link || "/",
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);
  event.notification.close();

  // Open the URL if it's defined in the message
  const urlToOpen = event.notification.tag || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
