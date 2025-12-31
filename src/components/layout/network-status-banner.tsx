"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

export function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive text-destructive-foreground sticky top-0 z-100 w-full"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium">
            <WifiOff className="size-4" />
            <span>
              You are currently offline. Some features may be unavailable.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
