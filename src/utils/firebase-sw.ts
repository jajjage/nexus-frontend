/**
 * Firebase Service Worker Setup
 * This file generates the service worker with env variables properly injected
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verify all required env vars are set
export function validateFirebaseConfig() {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missing = requiredVars.filter(
    (varName) => !process.env[varName as keyof typeof process.env]
  );

  if (missing.length > 0) {
    console.warn("[FIREBASE] Missing environment variables:", missing);
    return false;
  }

  return true;
}

// Generate the inline script for the service worker
export function getFirebaseSwScript(): string {
  return `
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[SW] Service Worker initialized');

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationId = payload.data?.notificationId || '';

  console.log('[SW] Notification ID:', notificationId);
  console.log('[SW] Showing notification with title:', notificationTitle);

  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.image || '/images/notification-icon.png',
    badge: '/images/notification-badge.png',
    click_action: payload.fcmOptions?.link || '/',
    tag: notificationId || 'notification', // Group notifications by ID
    requireInteraction: false, // Set to true if you want notifications to stay until user interacts
    // Pass notificationId in data so it can be accessed on click
    data: {
      notificationId: notificationId,
      ...payload.data,
    },
  };

  try {
    self.registration.showNotification(notificationTitle, notificationOptions);
    console.log('[SW] Notification shown successfully for ID:', notificationId);
  } catch (error) {
    console.error('[SW] Failed to show notification:', error);
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  event.notification.close();

  // Extract notificationId and transactionId from notification.data
  const notificationId = event.notification.data?.notificationId;
  const transactionId = event.notification.data?.transactionId;
  let urlToOpen = '/dashboard';

  // If notificationId exists, navigate to notifications page
  if (notificationId) {
    urlToOpen = '/dashboard/notifications/';
  }
  // If only transactionId exists, navigate to transaction detail page
  else if (transactionId) {
    urlToOpen = '/dashboard/transactions/' + transactionId;
  }

  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Found', clientList.length, 'open clients');

        // Check if a window with the app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          console.log('[SW] Checking client:', client.url);

          if (client.url.includes(self.location.origin)) {
            console.log('[SW] Found matching client, navigating...');

            // Focus the existing window
            if ('focus' in client) {
              client.focus();
            }

            // Send navigation message to the client
            // The client must listen for 'navigate' messages and handle routing
            client.postMessage({
              type: 'navigate',
              url: urlToOpen,
              notificationId: notificationId,
              transactionId: transactionId
            });
            console.log('[SW] Sent navigation message to client');
            return;
          }
        }

        // If no window is open, open a new one
        console.log('[SW] No existing client found, opening new window');
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((err) => {
        console.error('[SW] Error handling notification click:', err);
        // Fallback: just open the URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
  `;
}
