"use client";

import { useAuth } from "@/hooks/useAuth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Extend Navigator interface for iOS Safari's non-standard standalone property
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

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
    (window.navigator as NavigatorStandalone).standalone === true
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

  // Use lazy initialization to avoid setState in useEffect
  const [isPwa] = useState(() => getIsPwa());

  const [isEnabled, setIsEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SOFT_LOCK_ENABLED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === "undefined") return false;
    const pwa = getIsPwa();

    try {
      const enabled = localStorage.getItem(SOFT_LOCK_ENABLED_KEY) === "true";
      if (!pwa || !enabled) return false;

      const lockState = localStorage.getItem(SOFT_LOCK_STATE_KEY);
      if (lockState === "locked") {
        console.log("[SoftLock] Restoring locked state after app restart");
        return true;
      }

      const lastUnlockTime = localStorage.getItem(SOFT_LOCK_TIMESTAMP_KEY);
      if (lastUnlockTime) {
        const elapsed = Date.now() - parseInt(lastUnlockTime, 10);
        if (elapsed > LOCK_AFTER_SECONDS * 1000) {
          console.log("[SoftLock] Locking due to timeout since last unlock");
          localStorage.setItem(SOFT_LOCK_STATE_KEY, "locked");
          return true;
        }
        return false;
      }

      // First ever launch with soft lock enabled - lock for security
      console.log("[SoftLock] Fresh start with soft lock enabled - locking");
      localStorage.setItem(SOFT_LOCK_STATE_KEY, "locked");
      return true;
    } catch {
      return false;
    }
  });

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
    try {
      localStorage.setItem(SOFT_LOCK_TIMESTAMP_KEY, Date.now().toString());
      localStorage.removeItem(SOFT_LOCK_STATE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Handle visibility change (app going to background/foreground)
  useEffect(() => {
    if (!isPwa || !isEnabled || !isAuthenticated) return;

    let lockTimeout: NodeJS.Timeout | null = null;
    const GRACE_PERIOD_MS = 90000; // 90 seconds (1.5 minutes) grace period before locking

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log(
          "[SoftLock] App going to background - starting 90s grace period"
        );
        lockTimeout = setTimeout(() => {
          console.log("[SoftLock] Grace period expired - LOCKING NOW");
          lock();
        }, GRACE_PERIOD_MS);
      } else if (document.visibilityState === "visible") {
        if (lockTimeout) {
          console.log(
            "[SoftLock] App returned within grace period - cancelling lock"
          );
          clearTimeout(lockTimeout);
          lockTimeout = null;
        }
        console.log(
          "[SoftLock] App coming to foreground, lock state:",
          isLocked
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (lockTimeout) {
        clearTimeout(lockTimeout);
      }
    };
  }, [isPwa, isEnabled, isAuthenticated, lock, isLocked]);

  // Auto-enable soft lock if user has app passcode set up - use ref to track if checked
  const hasAutoEnabledRef = React.useRef(false);
  useEffect(() => {
    if (hasAutoEnabledRef.current) return;
    if (isAuthenticated && user?.hasPasscode && isPwa) {
      try {
        const preference = localStorage.getItem(SOFT_LOCK_ENABLED_KEY);
        if (preference === null) {
          hasAutoEnabledRef.current = true;
          // Use setTimeout to avoid synchronous setState in effect
          setTimeout(() => setEnabled(true), 0);
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
