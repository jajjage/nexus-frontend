import apiClient from "@/lib/api-client";
import {
  registerServiceWorker,
  requestAndGetFcmToken,
} from "@/lib/firebase-client";
import {
  areNotificationsEnabled,
  registerFcmToken,
  requestNotificationPermission,
  syncFcmToken,
  unlinkFcmToken,
} from "@/services/notification.service";
import { Mock } from "vitest";

/**
 * Mock modules
 */
vi.mock("@/lib/api-client");
vi.mock("@/lib/firebase-client");

describe("Notification Service", () => {
  const mockToken = "mock_fcm_token_12345";
  const mockPlatform = "web";

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    // Mock the Firebase calls
    (requestAndGetFcmToken as Mock).mockResolvedValue(mockToken);
    (registerServiceWorker as Mock).mockResolvedValue(undefined);
    // Mock the API client
    (apiClient.post as Mock).mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("syncFcmToken", () => {
    it("should sync token when it's a new token (first time)", async () => {
      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(true);
      expect(registerServiceWorker).toHaveBeenCalled();
      expect(requestAndGetFcmToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: mockToken,
        platform: mockPlatform,
      });
      // Verify token was saved to localStorage
      expect(localStorage.getItem("last_fcm_token")).toBe(mockToken);
    });

    it("should skip sync when token hasn't changed", async () => {
      // First sync
      await syncFcmToken(mockPlatform);
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      // Reset mock to verify it's not called again
      vi.clearAllMocks();
      (requestAndGetFcmToken as Mock).mockResolvedValue(mockToken);
      (registerServiceWorker as Mock).mockResolvedValue(undefined);

      // Second sync with same token
      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(true);
      // Should return true but not call the API
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("should sync when token changes (Firebase refreshes token)", async () => {
      // First sync
      await syncFcmToken(mockPlatform);
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      // Reset and setup new token
      vi.clearAllMocks();
      const newToken = "mock_fcm_token_67890";
      (requestAndGetFcmToken as Mock).mockResolvedValue(newToken);
      (registerServiceWorker as Mock).mockResolvedValue(undefined);
      (apiClient.post as Mock).mockResolvedValue({ status: 200 });

      // Second sync with new token
      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: newToken,
        platform: mockPlatform,
      });
      expect(localStorage.getItem("last_fcm_token")).toBe(newToken);
    });

    it("should return false when no token is available", async () => {
      (requestAndGetFcmToken as Mock).mockResolvedValue(null);

      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("should return false when API call fails", async () => {
      (apiClient.post as Mock).mockRejectedValue(new Error("API Error"));

      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(false);
      // Token should not be saved on failure
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });

    it("should return false on API error status", async () => {
      (apiClient.post as Mock).mockResolvedValue({ status: 500 });

      const result = await syncFcmToken(mockPlatform);

      expect(result).toBe(false);
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });

    it("should use 'web' as default platform", async () => {
      await syncFcmToken(); // No platform specified

      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({
          platform: "web",
        })
      );
    });
  });

  describe("unlinkFcmToken", () => {
    it("should unlink token on logout", async () => {
      // First sync to save token
      await syncFcmToken(mockPlatform);
      const savedToken = localStorage.getItem("last_fcm_token");

      // Then unlink
      (apiClient.post as Mock).mockResolvedValue({ status: 200 });
      const result = await unlinkFcmToken();

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens/unlink",
        {
          token: savedToken,
        }
      );
      // Token should be cleared from localStorage
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
      expect(localStorage.getItem("fcm_token_timestamp")).toBeNull();
    });

    it("should return true when no token exists to unlink", async () => {
      // No token saved
      const result = await unlinkFcmToken();

      expect(result).toBe(true);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("should clear localStorage even if API call fails", async () => {
      // First sync to save token
      await syncFcmToken(mockPlatform);
      expect(localStorage.getItem("last_fcm_token")).toBe(mockToken);

      // Mock API failure
      (apiClient.post as Mock).mockRejectedValue(new Error("API Error"));

      const result = await unlinkFcmToken();

      // Should attempt unlink (return false for failure)
      expect(result).toBe(false);
      // But localStorage should still be cleared
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });

    it("should return false on API error status", async () => {
      // First sync to save token
      await syncFcmToken(mockPlatform);
      expect(localStorage.getItem("last_fcm_token")).toBe(mockToken);

      // Reset and prepare for unlink test
      vi.clearAllMocks();
      (apiClient.post as Mock).mockResolvedValue({ status: 500 });

      const result = await unlinkFcmToken();

      // The API returned error status, so the operation failed
      // but localStorage is cleared only on exceptions, not on bad status
      expect(result).toBe(false);
    });

    it("should prevent next user from receiving previous user's notifications", async () => {
      // Simulate User A login and sync
      await syncFcmToken(mockPlatform);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: mockToken })
      );

      // User A logs out
      (apiClient.post as Mock).mockResolvedValue({ status: 200 });
      await unlinkFcmToken();

      // Verify unlink was called
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens/unlink",
        {
          token: mockToken,
        }
      );

      // localStorage is cleared
      expect(localStorage.getItem("last_fcm_token")).toBeNull();

      // Now User B uses same device and logs in
      vi.clearAllMocks();
      const userBToken = "user_b_token_99999";
      (requestAndGetFcmToken as Mock).mockResolvedValue(userBToken);
      (registerServiceWorker as Mock).mockResolvedValue(undefined);
      (apiClient.post as Mock).mockResolvedValue({ status: 200 });

      await syncFcmToken(mockPlatform);

      // User B's token should be sent
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: userBToken })
      );
      // User A's token should not be in localStorage
      expect(localStorage.getItem("last_fcm_token")).toBe(userBToken);
      expect(localStorage.getItem("last_fcm_token")).not.toBe(mockToken);
    });
  });

  describe("registerFcmToken (legacy function)", () => {
    it("should call syncFcmToken", async () => {
      const result = await registerFcmToken(mockPlatform);

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: mockToken,
        platform: mockPlatform,
      });
    });
  });

  describe("requestNotificationPermission", () => {
    it("should request permission if not granted", async () => {
      // @ts-ignore
      global.Notification = {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      };

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it("should return true if permission already granted", async () => {
      // @ts-ignore
      global.Notification = {
        permission: "granted",
      };

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
    });

    it("should return false if permission denied", async () => {
      // @ts-ignore
      global.Notification = {
        permission: "denied",
      };

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });

    it("should return false if notifications not supported", async () => {
      const originalNotification = global.Notification;
      // @ts-ignore
      delete global.Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe(false);

      global.Notification = originalNotification;
    });
  });

  describe("areNotificationsEnabled", () => {
    it("should return true when notifications are permitted", () => {
      // @ts-ignore
      global.Notification = {
        permission: "granted",
      };

      const result = areNotificationsEnabled();

      expect(result).toBe(true);
    });

    it("should return false when notifications are denied", () => {
      // @ts-ignore
      global.Notification = {
        permission: "denied",
      };

      const result = areNotificationsEnabled();

      expect(result).toBe(false);
    });

    it("should return false when Notification API not available", () => {
      const originalNotification = global.Notification;
      // @ts-ignore
      delete global.Notification;

      const result = areNotificationsEnabled();

      expect(result).toBe(false);

      global.Notification = originalNotification;
    });
  });
});
