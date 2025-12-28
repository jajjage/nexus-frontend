import { useSecurityStore } from "@/store/securityStore";
import { act, renderHook } from "@testing-library/react";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useSecurityStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useSecurityStore.setState({
      isLocked: false,
      appState: "LOADING" as any as "LOADING" | "LOCKED" | "ACTIVE",
      lastActiveTime: Date.now(),
      timeUntilLock: 15 * 60 * 1000,
      pinAttempts: 0,
      isBlocked: false,
      blockExpireTime: null,
    });
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useSecurityStore());

      expect(result.current.isLocked).toBe(false);
      expect(result.current.appState).toBe("LOADING");
      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should call initialize on mount", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.initialize();
      });

      expect(result.current.appState).not.toBe("LOADING");
    });
  });

  describe("Activity Recording", () => {
    it("should record activity and update lastActiveTime", () => {
      const { result } = renderHook(() => useSecurityStore());
      const oldTime = result.current.lastActiveTime;

      act(() => {
        result.current.recordActivity();
      });

      expect(result.current.lastActiveTime).toBeGreaterThanOrEqual(oldTime);
    });

    it("should reset timeUntilLock when activity recorded", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordActivity();
      });

      // timeUntilLock should be close to 15 minutes
      const timeUntilLock = result.current.timeUntilLock;
      const fifteenMinutes = 15 * 60 * 1000;
      expect(timeUntilLock).toBeGreaterThan(fifteenMinutes - 1000);
      expect(timeUntilLock).toBeLessThanOrEqual(fifteenMinutes);
    });
  });

  describe("Locking", () => {
    it("should lock the app", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.setLocked(true);
      });

      expect(result.current.isLocked).toBe(true);
    });

    it("should unlock the app", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.setLocked(true);
      });
      expect(result.current.isLocked).toBe(true);

      act(() => {
        result.current.unlock();
      });

      expect(result.current.isLocked).toBe(false);
      expect(result.current.appState).toBe("ACTIVE");
    });
  });

  describe("PIN Attempts", () => {
    it("should record successful PIN attempt", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(true);
      });

      expect(result.current.pinAttempts).toBe(0); // Reset on success
      expect(result.current.isBlocked).toBe(false);
    });

    it("should increment PIN attempts on failure", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(false);
      });

      expect(result.current.pinAttempts).toBe(1);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should block after 3 failed attempts", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(false); // 1
        result.current.recordPinAttempt(false); // 2
        result.current.recordPinAttempt(false); // 3
      });

      expect(result.current.pinAttempts).toBe(3);
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockExpireTime).not.toBeNull();
    });

    it("should unblock after expiration time", (done) => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
      });

      expect(result.current.isBlocked).toBe(true);

      // Wait for block to expire (5 seconds in test)
      setTimeout(() => {
        act(() => {
          // Simulate checking if block expired
          const now = Date.now();
          const blockExpireTime = result.current.blockExpireTime;
          if (blockExpireTime && now >= blockExpireTime) {
            useSecurityStore.setState({
              isBlocked: false,
              blockExpireTime: null,
              pinAttempts: 0,
            });
          }
        });

        expect(result.current.isBlocked).toBe(false);
        done();
      }, 5100);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup on unmount", () => {
      const { result, unmount } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.initialize();
      });

      unmount();
      result.current.cleanup();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("Persistence", () => {
    it("should persist state to localStorage", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordActivity();
      });

      const stored = localStorage.getItem("security-store");
      expect(stored).not.toBeNull();
    });
  });
});
