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
    setIsPwa(getIsPwa());

    // Check if soft lock is enabled in localStorage
    try {
      const enabled = localStorage.getItem(SOFT_LOCK_ENABLED_KEY);
      setIsEnabledState(enabled === "true");
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
    }
  }, [isAuthenticated, isEnabled]);

  // Unlock the app
  const unlock = useCallback(() => {
    console.log("[SoftLock] Unlocking app");
    setIsLocked(false);
    // Update last active timestamp
    try {
      localStorage.setItem(SOFT_LOCK_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  }, []);

  // Handle visibility change (app going to background/foreground)
  useEffect(() => {
    if (!isPwa || !isEnabled || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // App going to background - save timestamp
        console.log("[SoftLock] App going to background");
        try {
          localStorage.setItem(SOFT_LOCK_TIMESTAMP_KEY, Date.now().toString());
        } catch {
          // Ignore
        }
      } else if (document.visibilityState === "visible") {
        // App coming to foreground - check if should lock
        console.log("[SoftLock] App coming to foreground");
        try {
          const timestamp = localStorage.getItem(SOFT_LOCK_TIMESTAMP_KEY);
          if (timestamp) {
            const elapsed = Date.now() - parseInt(timestamp, 10);
            const shouldLock = elapsed > LOCK_AFTER_SECONDS * 1000;
            console.log(
              "[SoftLock] Elapsed:",
              elapsed,
              "Should lock:",
              shouldLock
            );
            if (shouldLock) {
              lock();
            }
          }
        } catch {
          // Ignore
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPwa, isEnabled, isAuthenticated, lock]);

  // Auto-enable soft lock if user has passcode/biometric set up
  useEffect(() => {
    if (isAuthenticated && user?.hasPin && isPwa) {
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
  }, [isAuthenticated, user?.hasPin, isPwa, setEnabled]);

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
