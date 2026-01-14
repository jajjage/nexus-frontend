"use client";

import { useAuth } from "@/hooks/useAuth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SoftLockContextValue {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const SoftLockContext = createContext<SoftLockContextValue>({
  isLocked: false,
  lock: () => {},
  unlock: () => {},
  isEnabled: false,
  setEnabled: () => {},
});

export function useSoftLock() {
  return useContext(SoftLockContext);
}

// Helper to detect if running as PWA
function getIsPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Storage key for soft lock preference
const SOFT_LOCK_ENABLED_KEY = "soft_lock_enabled";
const SOFT_LOCK_TIMESTAMP_KEY = "soft_lock_timestamp";
const SOFT_LOCK_STATE_KEY = "soft_lock_state"; // Persist lock state for refresh AND app restart
const LOCK_AFTER_SECONDS = 300; // Lock after 5 minutes in background

interface SoftLockProviderProps {
  children: React.ReactNode;
}

export function SoftLockProvider({ children }: SoftLockProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isPwa, setIsPwa] = useState(false);

  // Initialize PWA detection and lock preference
  useEffect(() => {
    const pwa = getIsPwa();
    setIsPwa(pwa);

    // Check if soft lock is enabled in localStorage
    try {
      const enabled = localStorage.getItem(SOFT_LOCK_ENABLED_KEY);
      const isEnabledValue = enabled === "true";
      setIsEnabledState(isEnabledValue);

      // CRITICAL FIX: Always lock on fresh PWA start if soft lock is enabled
      // This handles the case when app is completely closed and reopened
      if (pwa && isEnabledValue) {
        // Check if this is a fresh start (no active session marker)
        const lastUnlockTime = localStorage.getItem(SOFT_LOCK_TIMESTAMP_KEY);
        const lockState = localStorage.getItem(SOFT_LOCK_STATE_KEY);

        if (lockState === "locked") {
          // Was locked before - stay locked
          console.log("[SoftLock] Restoring locked state after app restart");
          setIsLocked(true);
        } else if (lastUnlockTime) {
          // Check if enough time has passed since last unlock
          const elapsed = Date.now() - parseInt(lastUnlockTime, 10);
          if (elapsed > LOCK_AFTER_SECONDS * 1000) {
            console.log(
              "[SoftLock] Locking due to timeout since last unlock:",
              elapsed,
              "ms"
            );
            setIsLocked(true);
            localStorage.setItem(SOFT_LOCK_STATE_KEY, "locked");
          }
        } else {
          // First ever launch or no timestamp - lock for security
          console.log(
            "[SoftLock] Fresh start with soft lock enabled - locking"
          );
          setIsLocked(true);
          localStorage.setItem(SOFT_LOCK_STATE_KEY, "locked");
        }
      }
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Save enabled state to localStorage
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    try {
      localStorage.setItem(SOFT_LOCK_ENABLED_KEY, enabled ? "true" : "false");
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Lock the app
  const lock = useCallback(() => {
    if (isAuthenticated && isEnabled) {
      console.log("[SoftLock] Locking app");
      setIsLocked(true);
      // Persist lock state in localStorage (survives app restart)
      try {
        localStorage.setItem(SOFT_LOCK_STATE_KEY, "locked");
      } catch {
        // Ignore
      }
    }
  }, [isAuthenticated, isEnabled]);

  // Unlock the app
  const unlock = useCallback(() => {
    console.log("[SoftLock] Unlocking app");
    setIsLocked(false);
    // Update last active timestamp and clear lock state
    try {
      localStorage.setItem(SOFT_LOCK_TIMESTAMP_KEY, Date.now().toString());
      localStorage.removeItem(SOFT_LOCK_STATE_KEY); // Clear lock state
    } catch {
      // Ignore
    }
  }, []);

  // Handle visibility change (app going to background/foreground)
  useEffect(() => {
    if (!isPwa || !isEnabled || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // CRITICAL FIX: Lock IMMEDIATELY when app goes to background
        // This ensures the dashboard is hidden before the browser suspends the page
        console.log("[SoftLock] App going to background - LOCKING IMMEDIATELY");
        lock();
      } else if (document.visibilityState === "visible") {
        // App coming to foreground - lock is already engaged
        // Just log for debugging
        console.log(
          "[SoftLock] App coming to foreground, lock state:",
          isLocked
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPwa, isEnabled, isAuthenticated, lock]);

  // Auto-enable soft lock if user has app passcode set up
  useEffect(() => {
    if (isAuthenticated && user?.hasPasscode && isPwa) {
      // Check if user hasn't explicitly set a preference
      try {
        const preference = localStorage.getItem(SOFT_LOCK_ENABLED_KEY);
        if (preference === null) {
          // Auto-enable for PWA users with passcode set
          setEnabled(true);
        }
      } catch {
        // Ignore
      }
    }
  }, [isAuthenticated, user?.hasPasscode, isPwa, setEnabled]);

  return (
    <SoftLockContext.Provider
      value={{
        isLocked,
        lock,
        unlock,
        isEnabled,
        setEnabled,
      }}
    >
      {children}
    </SoftLockContext.Provider>
  );
}
