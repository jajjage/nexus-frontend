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
  recordPinAttempt: (success: boolean) => boolean; // Returns true if max attempts (3) exceeded
  resetPinAttempts: () => void;
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
       * Reset PIN attempts explicitly
       */
      resetPinAttempts: () => {
        console.log("[Security] Resetting PIN attempts");
        set({
          pinAttempts: 0,
          isBlocked: false,
          blockExpireTime: null,
        });
      },

      /**
       * Track PIN attempts for transactions
       * - Success: Clear attempts
       * - Failure: Increment. After 3 attempts, reset state and return true to signal redirect.
       */
      recordPinAttempt: (success: boolean): boolean => {
        if (success) {
          console.log("[Security] PIN attempt successful");
          set({
            pinAttempts: 0,
            isBlocked: false,
            blockExpireTime: null,
          });
          return false;
        } else {
          const currentAttempts = get().pinAttempts;
          const newAttempts = currentAttempts + 1;

          console.log("[Security] PIN attempt failed", {
            attempt: newAttempts,
            maxAttempts: 3,
          });

          if (newAttempts >= 3) {
            console.log(
              "[Security] Max failed PIN attempts reached (3). Resetting state so next attempt works normally."
            );
            set({
              pinAttempts: 0,
              isBlocked: false,
              blockExpireTime: null,
            });
            return true; // Exceeded max attempts -> redirect user
          } else {
            set({
              pinAttempts: newAttempts,
              isBlocked: false,
              blockExpireTime: null,
            });
            return false;
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
        pinAttempts: state.pinAttempts,
        isBlocked: state.isBlocked,
        blockExpireTime: state.blockExpireTime,
      }),
    }
  )
);
