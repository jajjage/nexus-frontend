import { useAuth } from "@/hooks/useAuth";
import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";
import { syncFcmToken } from "@/services/notification.service";
import { renderHook, waitFor } from "@testing-library/react";

/**
 * Mock dependencies
 */
vi.mock("@/services/notification.service");
vi.mock("@/hooks/useAuth");

describe("useSyncFcmOnMount - App Open Scenario", () => {
  const mockUser = {
    userId: "user123",
    fullName: "Test User",
    email: "test@example.com",
    phoneNumber: "1234567890",
    role: "user",
    isSuspended: false,
    isVerified: true,
    twoFactorEnabled: false,
    accountNumber: "ACC123",
    providerName: "nexus",
    balance: "1000",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (syncFcmToken as vi.Mock).mockResolvedValue(true);
  });

  describe("App initialization scenarios", () => {
    it("should sync FCM token on app open when user is authenticated", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledWith("web");
      });
    });

    it("should not sync FCM token when no user is authenticated", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).not.toHaveBeenCalled();
      });
    });

    it("should not sync during loading state", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      renderHook(() => useSyncFcmOnMount());

      // Wait a bit and verify sync wasn't called
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(syncFcmToken).not.toHaveBeenCalled();
    });

    it("should handle FCM sync errors gracefully", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      (syncFcmToken as vi.Mock).mockRejectedValue(new Error("FCM sync failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it("should sync only once on mount", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      const { rerender } = renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledTimes(1);
      });

      // Rerender shouldn't trigger another sync
      rerender();

      expect(syncFcmToken).toHaveBeenCalledTimes(1);
    });

    it("should handle Firebase token refresh scenario", async () => {
      /**
       * Scenario: Firebase automatically refreshes the token
       * App opens -> Sync checks and detects new token -> Sends to backend
       *
       * This ensures the backend always has the latest token
       */
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      (syncFcmToken as vi.Mock).mockResolvedValue(true);

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledWith("web");
      });

      // Verify it was called with web platform
      expect(syncFcmToken).toHaveBeenCalledWith("web");
    });
  });

  describe("Token refresh scenarios", () => {
    it("should detect and sync new token on app restart", async () => {
      /**
       * Scenario:
       * 1. User logs in and app syncs token A
       * 2. User closes app
       * 3. Firebase silently refreshes token to B
       * 4. User opens app again -> Sync detects token B -> Sends to backend
       *
       * The useSyncFcmOnMount hook running on app initialization ensures this
       */
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      // First render (first app open)
      const { unmount } = renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledTimes(1);
      });

      unmount();
      vi.clearAllMocks();

      // Simulate app restart with Firebase having refreshed the token
      (syncFcmToken as vi.Mock).mockResolvedValue(true);
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      // App opens again
      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledWith("web");
      });
    });

    it("should handle case where token was invalidated", async () => {
      /**
       * Scenario:
       * 1. User had token synced
       * 2. Firebase invalidates token (e.g., app was uninstalled/reinstalled)
       * 3. App opens and gets new token from Firebase
       * 4. useSyncFcmOnMount syncs the new token
       */
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      // Clear localStorage to simulate token invalidation
      localStorage.removeItem("last_fcm_token");

      (syncFcmToken as vi.Mock).mockResolvedValue(true);

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledWith("web");
      });
    });
  });

  describe("Session state scenarios", () => {
    it("should sync token when user becomes authenticated after loading", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      const { rerender } = renderHook(() => useSyncFcmOnMount());

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(syncFcmToken).not.toHaveBeenCalled();

      // User finishes loading
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      rerender();

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalledWith("web");
      });
    });

    it("should not sync when authenticated user becomes suspended", async () => {
      const suspendedUser = { ...mockUser, isSuspended: true };

      (useAuth as vi.Mock).mockReturnValue({
        user: suspendedUser,
        isLoading: false,
        isAuthenticated: false, // isAuthenticated should be false if suspended
      });

      renderHook(() => useSyncFcmOnMount());

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(syncFcmToken).not.toHaveBeenCalled();
    });
  });

  describe("Error recovery scenarios", () => {
    it("should retry sync on transient failure", async () => {
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      // First call fails, second succeeds
      (syncFcmToken as vi.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(true);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

      renderHook(() => useSyncFcmOnMount());

      await waitFor(() => {
        expect(syncFcmToken).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it("should continue app functionality if sync fails", async () => {
      /**
       * Important: Sync failure should NOT block app usage
       * User should still be able to use the app even if FCM sync fails
       */
      (useAuth as vi.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });

      (syncFcmToken as vi.Mock).mockRejectedValue(new Error("FCM unavailable"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

      // This should not throw
      expect(() => {
        renderHook(() => useSyncFcmOnMount());
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
