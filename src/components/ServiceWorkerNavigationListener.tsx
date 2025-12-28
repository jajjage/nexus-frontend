"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Listens for navigation messages from the service worker
 * When a notification is clicked, the SW sends a navigation message
 * This component listens for those messages and uses Next.js router to navigate
 */
export function ServiceWorkerNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Register the client service worker if not already registered
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        console.log("[Client] Service worker registered:", reg.scope);
      } catch (err) {
        console.warn("[Client] Service worker registration failed:", err);
      }
    };

    registerSW();

    // Listen for messages from the service worker
    const messageListener = (event: Event) => {
      const messageEvent = event as MessageEvent;
      if (messageEvent.data?.type === "navigate") {
        console.log("[Client] Received navigate message:", messageEvent.data);
        const { url } = messageEvent.data;

        if (url) {
          console.log("[Client] Navigating to:", url);
          router.push(url);
        }
      }
    };

    // Add listener to the service worker container (supports message events)
    navigator.serviceWorker.addEventListener("message", messageListener);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener("message", messageListener);
    };
  }, [router]);

  return null;
}
