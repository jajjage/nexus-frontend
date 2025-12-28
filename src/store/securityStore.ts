"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Security Store
 *
 * Manages:
 * - Soft lock state (inactivity timeout)
 * - App state (LOADING | LOCKED | ACTIVE)
 * - PIN attempt tracking for transactions
 *
 * Persists to localStorage:
 * - lastActiveTime: When user was last active
 * - isLocked: Current lock state
 */

interface SecurityState {
  // App lock state
  isLocked: boolean;
  appState: "LOADING" | "LOCKED" | "ACTIVE";
  lastActiveTime: number;

  // Inactivity tracking
  timeUntilLock: number;
  showInactivityWarning: boolean;

  // PIN attempt tracking (for transactions)
  pinAttempts: number;
  isBlocked: boolean;
  blockExpireTime: number | null;

  // Actions
  initialize: () => void;
  recordActivity: () => void;
  setLocked: (locked: boolean) => void;
  unlock: () => void;
  recordPinAttempt: (success: boolean) => void;
  cleanup: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set: any, get: any) => ({
      // Initial state
      isLocked: false as boolean,
      appState: "LOADING" as any as "LOADING" | "LOCKED" | "ACTIVE",
      lastActiveTime: Date.now(),
      timeUntilLock: 15 * 60 * 1000,
      showInactivityWarning: false as boolean,
      pinAttempts: 0,
      isBlocked: false as boolean,
      blockExpireTime: null as number | null,

      /**
       * Initialize security store
       * - Check if should start in locked state
       * - Set up inactivity check interval
       */
      initialize: () => {
        const lastActive = parseInt(
          localStorage.getItem("security_last_active") || "0"
        );
        const timeSinceActive = Date.now() - lastActive;
        const shouldStartLocked = timeSinceActive > 15 * 60 * 1000;

        console.log("[Security] Initializing store", {
          lastActive,
          timeSinceActive: Math.round(timeSinceActive / 1000),
          shouldStartLocked,
        });

        set({
          appState: shouldStartLocked ? "LOCKED" : "ACTIVE",
          isLocked: shouldStartLocked,
          lastActiveTime: shouldStartLocked ? lastActive : Date.now(),
        });

        // Set up inactivity check interval
        const checkInterval = setInterval(() => {
          const state = get();
          const now = Date.now();
          const timeSinceActivity = now - state.lastActiveTime;
          const timeRemaining = Math.max(0, 15 * 60 * 1000 - timeSinceActivity);

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

          // Update warning threshold (show warning at 2 minutes remaining)
          const shouldShowWarning =
            timeRemaining < 2 * 60 * 1000 && timeRemaining > 0;

          if (shouldShowWarning !== state.showInactivityWarning) {
            set({ showInactivityWarning: shouldShowWarning });
          }

          // Update time until lock
          if (timeRemaining !== state.timeUntilLock) {
            set({ timeUntilLock: timeRemaining });
          }

          // Check if should lock
          if (
            timeSinceActivity >= 15 * 60 * 1000 &&
            !state.isLocked &&
            state.appState !== "LOADING"
          ) {
            console.log("[Security] Lock triggered - inactivity timeout");
            set({
              isLocked: true,
              appState: "LOCKED",
            });
          }
        }, 1000);

        (get as any)._checkInterval = checkInterval;
      },

      /**
       * Record user activity
       * - Update timestamp
       * - Reset inactivity timer
       * - Clear lock state
       */
      recordActivity: () => {
        const now = Date.now();
        localStorage.setItem("security_last_active", now.toString());

        const state = get();
        if (state.isLocked || state.appState === "LOCKED") {
          console.log("[Security] Activity recorded - unlocking app");
        }

        set({
          lastActiveTime: now,
          isLocked: false,
          appState: "ACTIVE",
          timeUntilLock: 15 * 60 * 1000,
          showInactivityWarning: false,
        });
      },

      /**
       * Manually set locked state
       */
      setLocked: (locked: boolean) => {
        set({
          isLocked: locked,
          appState: locked ? "LOCKED" : "ACTIVE",
        });
      },

      /**
       * Unlock and reset inactivity timer
       */
      unlock: () => {
        console.log("[Security] Unlock called");
        set({
          isLocked: false,
          appState: "ACTIVE",
        });
        get().recordActivity();
      },

      /**
       * Track PIN attempts for transactions
       * - Success: Clear attempts
       * - Failure: Increment and block after 3 attempts
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
            maxAttempts: 3,
          });

          if (newAttempts >= 3) {
            // Block for 5 minutes after 3 failed attempts
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
        lastActiveTime: state.lastActiveTime,
        isLocked: state.isLocked,
      }),
    }
  )
);
