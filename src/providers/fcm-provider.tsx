"use client";

import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";
import { memo, useMemo } from "react";

/**
 * FCM Provider Component
 *
 * Wraps the application to provide FCM token synchronization on mount.
 * This is a Client Component that calls the useSyncFcmOnMount hook.
 * Wrapped with memo() to prevent unnecessary re-renders.
 *
 * Usage in RootLayout:
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <FcmProvider>
 *           <OtherProviders>{children}</OtherProviders>
 *         </FcmProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
function FcmProviderComponent({ children }: { children: React.ReactNode }) {
  // Initialize FCM token sync on app mount
  // This hook only sets up an effect that runs once
  useSyncFcmOnMount();

  // Memoize children to prevent unnecessary re-renders
  // This ensures that if the parent re-renders, children don't re-render
  // unless children itself changes (which it shouldn't at the root level)
  const memoizedChildren = useMemo(() => children, [children]);

  return <>{memoizedChildren}</>;
}

// Memoize to prevent re-renders from parent provider changes
export const FcmProvider = memo(FcmProviderComponent);
