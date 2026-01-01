"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SecurityState {
  // PIN attempt tracking (for transactions)
  pinAttempts: number;
  isBlocked: boolean;
  blockExpireTime: number | null;

  // Actions
  initialize: () => void;
  recordPinAttempt: (success: boolean) => void;
  cleanup: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set: any, get: any) => ({
      // Initial state
      pinAttempts: 0,
      isBlocked: false as boolean,
      blockExpireTime: null as number | null,

      /**
       * Initialize security store
       * - Set up check interval for unblocking
       */
      initialize: () => {
        // Set up check interval
        const checkInterval = setInterval(() => {
          const state = get();
          const now = Date.now();

          // Check if PIN block expired
          if (
            state.isBlocked &&
            state.blockExpireTime &&
            now > state.blockExpireTime
          ) {
            console.log("[Security] PIN block expired");
            set({
              isBlocked: false,
              blockExpireTime: null,
              pinAttempts: 0,
            });
          }
        }, 1000);

        (get as any)._checkInterval = checkInterval;
      },

      /**
       * Track PIN attempts for transactions
       * - Success: Clear attempts
       * - Failure: Increment and block after 5 attempts
       */
      recordPinAttempt: (success: boolean) => {
        if (success) {
          console.log("[Security] PIN attempt successful");
          set({
            pinAttempts: 0,
            isBlocked: false,
            blockExpireTime: null,
          });
        } else {
          const currentAttempts = get().pinAttempts;
          const newAttempts = currentAttempts + 1;

          console.log("[Security] PIN attempt failed", {
            attempt: newAttempts,
            maxAttempts: 5,
          });

          if (newAttempts >= 5) {
            // Block for 5 minutes after 5 failed attempts
            const blockUntil = Date.now() + 5 * 60 * 1000;
            console.log("[Security] PIN blocked for 5 minutes");
            set({
              pinAttempts: newAttempts,
              isBlocked: true,
              blockExpireTime: blockUntil,
            });
          } else {
            set({ pinAttempts: newAttempts });
          }
        }
      },

      /**
       * Cleanup - called on app unmount
       */
      cleanup: () => {
        const interval = (get as any)._checkInterval;
        if (interval) {
          clearInterval(interval);
          console.log("[Security] Cleanup - interval cleared");
        }
      },
    }),
    {
      name: "security-store",
      partialize: (state: any) => ({
        // We only persist blocking state to prevent bypassing block by refresh
        pinAttempts: state.pinAttempts,
        isBlocked: state.isBlocked,
        blockExpireTime: state.blockExpireTime,
      }),
    }
  )
);
