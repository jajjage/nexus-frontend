import { SoftLockProvider, useSoftLock } from "@/context/SoftLockContext";
import { act, render, screen } from "@testing-library/react";

// Mock useAuth hook - hasPin: false to prevent auto-enable
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: {
      userId: "user-123",
      role: "user",
      hasPin: false, // No passcode = soft lock won't auto-enable
    },
  })),
}));

// Mock WebAuthnService
vi.mock("@/services/webauthn.service", () => ({
  WebAuthnService: {
    isWebAuthnSupported: vi.fn(() => Promise.resolve(true)),
  },
}));

// Helper component to test the context
function TestConsumer() {
  const { isLocked, lock, unlock, isEnabled, setEnabled } = useSoftLock();
  return (
    <div>
      <span data-testid="is-locked">{isLocked ? "locked" : "unlocked"}</span>
      <span data-testid="is-enabled">{isEnabled ? "enabled" : "disabled"}</span>
      <button data-testid="lock-btn" onClick={lock}>
        Lock
      </button>
      <button data-testid="unlock-btn" onClick={unlock}>
        Unlock
      </button>
      <button data-testid="enable-btn" onClick={() => setEnabled(true)}>
        Enable
      </button>
      <button data-testid="disable-btn" onClick={() => setEnabled(false)}>
        Disable
      </button>
    </div>
  );
}

describe("SoftLockContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    // Mock matchMedia for PWA detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const renderWithProvider = () => {
    return render(
      <SoftLockProvider>
        <TestConsumer />
      </SoftLockProvider>
    );
  };

  describe("Initial State", () => {
    it("should start unlocked", () => {
      renderWithProvider();
      expect(screen.getByTestId("is-locked")).toHaveTextContent("unlocked");
    });

    it("should start disabled by default", () => {
      renderWithProvider();
      expect(screen.getByTestId("is-enabled")).toHaveTextContent("disabled");
    });
  });

  describe("Enable/Disable", () => {
    it("should enable soft lock when setEnabled(true) is called", async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByTestId("enable-btn").click();
      });

      expect(screen.getByTestId("is-enabled")).toHaveTextContent("enabled");
    });

    it("should persist enabled state to localStorage", async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByTestId("enable-btn").click();
      });

      expect(localStorage.getItem("soft_lock_enabled")).toBe("true");
    });

    it("should disable soft lock when setEnabled(false) is called", async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByTestId("enable-btn").click();
      });

      await act(async () => {
        screen.getByTestId("disable-btn").click();
      });

      expect(screen.getByTestId("is-enabled")).toHaveTextContent("disabled");
    });
  });

  describe("Lock/Unlock", () => {
    it("should lock when lock() is called and enabled", async () => {
      renderWithProvider();

      // First enable
      await act(async () => {
        screen.getByTestId("enable-btn").click();
      });

      // Then lock
      await act(async () => {
        screen.getByTestId("lock-btn").click();
      });

      expect(screen.getByTestId("is-locked")).toHaveTextContent("locked");
    });

    it("should not lock when disabled", async () => {
      renderWithProvider();

      // Try to lock without enabling
      await act(async () => {
        screen.getByTestId("lock-btn").click();
      });

      expect(screen.getByTestId("is-locked")).toHaveTextContent("unlocked");
    });

    it("should unlock when unlock() is called", async () => {
      renderWithProvider();

      // Enable and lock
      await act(async () => {
        screen.getByTestId("enable-btn").click();
      });
      await act(async () => {
        screen.getByTestId("lock-btn").click();
      });

      // Then unlock
      await act(async () => {
        screen.getByTestId("unlock-btn").click();
      });

      expect(screen.getByTestId("is-locked")).toHaveTextContent("unlocked");
    });
  });
});
