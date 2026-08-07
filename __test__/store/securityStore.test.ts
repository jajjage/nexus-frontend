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

      let isExceeded = true;
      act(() => {
        isExceeded = result.current.recordPinAttempt(true);
      });

      expect(isExceeded).toBe(false);
      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should increment PIN attempts on failure", () => {
      const { result } = renderHook(() => useSecurityStore());

      let isExceeded = true;
      act(() => {
        isExceeded = result.current.recordPinAttempt(false);
      });

      expect(isExceeded).toBe(false);
      expect(result.current.pinAttempts).toBe(1);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should reset state and return true when max attempts (3) reached", () => {
      const { result } = renderHook(() => useSecurityStore());

      let res1: boolean = false;
      let res2: boolean = false;
      let res3: boolean = false;

      act(() => {
        res1 = result.current.recordPinAttempt(false); // 1
        res2 = result.current.recordPinAttempt(false); // 2
      });

      expect(res1).toBe(false);
      expect(res2).toBe(false);
      expect(result.current.pinAttempts).toBe(2);

      act(() => {
        res3 = result.current.recordPinAttempt(false); // 3
      });

      expect(res3).toBe(true);
      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should reset PIN attempts explicitly", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        result.current.recordPinAttempt(false);
        result.current.resetPinAttempts();
      });

      expect(result.current.pinAttempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });

    it("should unblock after expiration time when blocked", () => {
      const { result } = renderHook(() => useSecurityStore());

      act(() => {
        useSecurityStore.setState({
          isBlocked: true,
          blockExpireTime: Date.now() + 5 * 60 * 1000,
        });
        result.current.initialize();
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
