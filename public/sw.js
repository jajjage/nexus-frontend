// Minimal service worker to satisfy installability checks
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(self.clients.claim());
});

// Optional fetch handler - keep simple to avoid interfering with app behavior
self.addEventListener("fetch", (event) => {
  // Do not intercept API calls - allow network
});
