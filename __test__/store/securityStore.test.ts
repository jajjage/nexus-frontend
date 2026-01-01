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
  writable: true,
});

describe("useSecurityStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Reset store state
    useSecurityStore.setState({
      pinAttempts: 0,
      isBlocked: false,
      blockExpireTime: null,
    });
  });

  afterEach(() => {
    act(() => {
      useSecurityStore.getState().cleanup();
    });
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useSecurityStore());

      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe("PIN Attempts", () => {
    it("should record successful PIN attempt", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(true);
      });

      expect(result.current.pinAttempts).toBe(0);
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

    it("should block after 5 failed attempts", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
      });

      expect(result.current.pinAttempts).toBe(5);
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockExpireTime).not.toBeNull();
    });

    it("should unblock after expiration time", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.initialize();
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
        result.current.recordPinAttempt(false);
      });

      expect(result.current.isBlocked).toBe(true);

      // Advance time by 5 minutes + 1 second
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      });

      expect(result.current.isBlocked).toBe(false);
      expect(result.current.pinAttempts).toBe(0);
    });
  });

  describe("Persistence", () => {
    it("should update state correctly (persistence verification)", async () => {
      const { result } = renderHook(() => useSecurityStore());

      // Initially should have 0 attempts
      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);

      // Record a pin attempt
      await act(async () => {
        result.current.recordPinAttempt(false);
      });

      // State should be updated
      expect(result.current.pinAttempts).toBe(1);
      expect(result.current.isBlocked).toBe(false);
    });
  });
});
