/**
 * Firebase Service Worker Configuration
 * GET /api/firebase-sw-config - Returns the Firebase config as JSON
 * This allows the service worker to fetch config at runtime
 */

import {
  getFirebaseSwScript,
  validateFirebaseConfig,
} from "@/utils/firebase-sw";
import { NextResponse } from "next/server";

export function GET() {
  // Serve the service-worker script (JS) with server-injected env vars.
  if (!validateFirebaseConfig()) {
    const errScript = `/* Firebase service worker config missing on server */`;
    return new NextResponse(errScript, {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const script = getFirebaseSwScript();
  return new NextResponse(script, {
    headers: { "Content-Type": "application/javascript" },
  });
}
