// Bootstrap service worker: load server-generated Firebase worker script
// This file intentionally contains no hardcoded keys. The full worker is
// served from the server route '/api/firebase-sw-config' which injects
// environment variables at request time.

try {
  importScripts("/api/firebase-sw-config");
} catch (e) {
  // If importScripts fails, log for debugging. The server route should return JS.
  console.error("Failed to load dynamic firebase-sw script:", e);
}
