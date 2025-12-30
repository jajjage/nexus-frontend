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
  inactivityTimeRemaining: number; // NEW: Used by InactivityWarning for countdown display
  showInactivityWarning: boolean;

  // PIN attempt tracking (for transactions)
  pinAttempts: number;
  isBlocked: boolean;
  blockExpireTime: number | null;

  // NEW: Grace period management (for visibility change)
  lockGracePeriodActive: boolean;
  lockGracePeriodEnd: number | null;

  // NEW: Browser close detection
  wasRecentlyClosed: boolean;

  // Actions
  initialize: () => void;
  recordActivity: () => void;
  setLocked: (locked: boolean) => void;
  unlock: () => void;
  recordPinAttempt: (success: boolean) => void;
  cleanup: () => void;
  startLockGracePeriod: () => void;
  cancelLockGracePeriod: () => void;
  checkBrowserCloseStatus: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set: any, get: any) => ({
      // Initial state
      isLocked: false as boolean,
      appState: "LOADING" as any as "LOADING" | "LOCKED" | "ACTIVE",
      lastActiveTime: Date.now(),
      timeUntilLock: 30 * 60 * 1000, // 30 minutes
      inactivityTimeRemaining: 30 * 60 * 1000, // NEW: Updated during interval check
      showInactivityWarning: false as boolean,
      pinAttempts: 0,
      isBlocked: false as boolean,
      blockExpireTime: null as number | null,
      lockGracePeriodActive: false as boolean,
      lockGracePeriodEnd: null as number | null,
      wasRecentlyClosed: false as boolean,

      /**
       * Initialize security store
       * - Check if should start in locked state
       * - Set up inactivity check interval
       */
      initialize: () => {
        // Check if browser was recently closed
        get().checkBrowserCloseStatus();

        const lastActive = parseInt(
          localStorage.getItem("security_last_active") || "0"
        );
        const timeSinceActive = Date.now() - lastActive;
        const shouldStartLocked = timeSinceActive > 30 * 60 * 1000; // 30 minutes

        // If browser was recently closed, always start locked (safety check)
        const wasRecentlyClosed = get().wasRecentlyClosed;

        console.log("[Security] Initializing store", {
          lastActive,
          timeSinceActive: Math.round(timeSinceActive / 1000),
          shouldStartLocked: shouldStartLocked || wasRecentlyClosed,
          wasRecentlyClosed,
        });

        set({
          appState:
            shouldStartLocked || wasRecentlyClosed ? "LOCKED" : "ACTIVE",
          isLocked: shouldStartLocked || wasRecentlyClosed,
          lastActiveTime: shouldStartLocked ? lastActive : Date.now(),
        });

        // Set up inactivity check interval
        const checkInterval = setInterval(() => {
          const state = get();
          const now = Date.now();
          const timeSinceActivity = now - state.lastActiveTime;
          const timeRemaining = Math.max(0, 30 * 60 * 1000 - timeSinceActivity); // 30 minutes

          // Skip inactivity checks while grace period is active
          if (state.lockGracePeriodActive) {
            const timeUntilGraceExpires = Math.max(
              0,
              state.lockGracePeriodEnd! - now
            );
            if (timeUntilGraceExpires <= 0) {
              // Grace period expired - lock now
              console.log("[Security] Lock grace period expired - locking");
              set({
                lockGracePeriodActive: false,
                lockGracePeriodEnd: null,
                isLocked: true,
                appState: "LOCKED",
              });
            }
            return; // Don't check inactivity while grace period is active
          }

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

          // Update warning threshold (show warning at 5 minutes remaining)
          const shouldShowWarning =
            timeRemaining < 5 * 60 * 1000 && timeRemaining > 0; // Show warning at 5 min left

          if (shouldShowWarning !== state.showInactivityWarning) {
            set({ showInactivityWarning: shouldShowWarning });
          }

          // Update remaining time for InactivityWarning countdown display
          if (shouldShowWarning) {
            set({ inactivityTimeRemaining: timeRemaining });
          }
          // Update time until lock
          if (timeRemaining !== state.timeUntilLock) {
            set({ timeUntilLock: timeRemaining });
          }

          // Check if should lock
          if (
            timeSinceActivity >= 30 * 60 * 1000 &&
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
          timeUntilLock: 30 * 60 * 1000, // 30 minutes
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
       * Start lock grace period (delay before locking on visibility change)
       * - Gives user 2 seconds to switch back before app locks
       * - Called when tab becomes hidden
       */
      startLockGracePeriod: () => {
        const graceMillis = 2000; // 2 seconds
        const graceEnd = Date.now() + graceMillis;
        console.log("[Security] Starting lock grace period (2 sec)");
        set({
          lockGracePeriodActive: true,
          lockGracePeriodEnd: graceEnd,
        });
      },

      /**
       * Cancel lock grace period (user switched back to tab)
       * - Called when tab becomes visible again
       */
      cancelLockGracePeriod: () => {
        console.log("[Security] Canceling lock grace period");
        set({
          lockGracePeriodActive: false,
          lockGracePeriodEnd: null,
        });
      },

      /**
       * Check if browser was recently closed and reopened
       * - Looks for app_closed_at timestamp in localStorage
       * - Sets wasRecentlyClosed flag if closed < 5 minutes ago
       * - Called during initialize() to detect app restart scenarios
       */
      checkBrowserCloseStatus: () => {
        const closedAt = localStorage.getItem("app_closed_at");
        if (!closedAt) {
          set({ wasRecentlyClosed: false });
          return;
        }

        const closedTime = parseInt(closedAt, 10);
        const timeSinceClosed = Date.now() - closedTime;
        const fiveMinutes = 5 * 60 * 1000;
        const wasRecentlyClosed = timeSinceClosed < fiveMinutes;

        // Clear the flag if it's been too long
        if (!wasRecentlyClosed) {
          localStorage.removeItem("app_closed_at");
        }

        console.log("[Security] Browser close check", {
          wasRecentlyClosed,
          timeSinceClosed: Math.round(timeSinceClosed / 1000) + "s",
        });

        set({ wasRecentlyClosed });
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
