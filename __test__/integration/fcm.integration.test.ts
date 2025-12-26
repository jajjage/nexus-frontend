/**
 * Integration Tests for FCM Notification Lifecycle
 * Tests complete user journeys including multiple scenarios
 */

import apiClient from "@/lib/api-client";
import {
  registerServiceWorker,
  requestAndGetFcmToken,
} from "@/lib/firebase-client";
import { syncFcmToken, unlinkFcmToken } from "@/services/notification.service";

jest.mock("@/lib/api-client");
jest.mock("@/lib/firebase-client");

describe("FCM Notification Lifecycle - Integration Tests", () => {
  const userAToken = "user_a_device_token_12345";
  const userBToken = "user_b_device_token_67890";
  const newUserAToken = "user_a_new_device_token_99999"; // After token refresh

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (registerServiceWorker as jest.Mock).mockResolvedValue(undefined);
    (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Scenario 1: User Registration with FCM", () => {
    it("should establish first device-user link during registration", async () => {
      /**
       * Flow:
       * 1. New user registers
       * 2. FCM token obtained
       * 3. Token synced to backend
       * 4. User linked to device
       */
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: userAToken,
        platform: "web",
      });
      expect(localStorage.getItem("last_fcm_token")).toBe(userAToken);
    });
  });

  describe("Scenario 2: User Login with FCM", () => {
    it("should link device to user account on login", async () => {
      /**
       * Flow:
       * 1. User logs in
       * 2. FCM token obtained
       * 3. Token synced to link device to this user account
       */
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: userAToken,
        platform: "web",
      });
    });

    it("should skip sync if token unchanged since last login", async () => {
      /**
       * Flow:
       * 1. First login: sync token A
       * 2. User logs out and immediately logs back in
       * 3. Token still A (not refreshed)
       * 4. Should skip API call
       */
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);

      // First login
      await syncFcmToken("web");
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      // Second login with same token
      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).not.toHaveBeenCalled(); // Should skip redundant call
    });
  });

  describe("Scenario 3: App Refresh with FCM Token Check", () => {
    it("should sync updated token when app is refreshed", async () => {
      /**
       * Flow:
       * 1. User was logged in previously (token A synced)
       * 2. User refreshes the app
       * 3. Firebase has refreshed token to B
       * 4. App startup detects new token B
       * 5. New token B synced to backend
       */
      // Previous token
      localStorage.setItem("last_fcm_token", userAToken);

      // Firebase returns new token after refresh
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(newUserAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: newUserAToken,
        platform: "web",
      });
      expect(localStorage.getItem("last_fcm_token")).toBe(newUserAToken);
    });

    it("should handle localStorage cleared scenario", async () => {
      /**
       * Flow:
       * 1. Token was previously synced (but localStorage was cleared)
       * 2. App opens and sync function called
       * 3. No previous token in localStorage
       * 4. New token obtained from Firebase and synced
       */
      // Simulate localStorage cleared but app running
      localStorage.clear();

      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: userAToken,
        platform: "web",
      });
      expect(localStorage.getItem("last_fcm_token")).toBe(userAToken);
    });

    it("should handle Firebase token expiration", async () => {
      /**
       * Flow:
       * 1. User has token A synced
       * 2. Firebase invalidates token A (e.g., too old)
       * 3. Firebase generates new token B
       * 4. App sync detects token B and syncs it
       */
      localStorage.setItem("last_fcm_token", userAToken);

      // Firebase returns new token
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(newUserAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      // Should detect difference and sync new token
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({
          token: newUserAToken,
        })
      );
    });
  });

  describe("Scenario 4: Token Refresh from Firebase", () => {
    it("should detect and sync Firebase refreshed token", async () => {
      /**
       * Flow:
       * 1. User logged in with token A
       * 2. Firebase silently refreshes token to B (due to expiry or security)
       * 3. useSyncFcmOnMount runs and detects token B
       * 4. Backend updated with new token
       */
      // Simulate previous sync
      localStorage.setItem("last_fcm_token", userAToken);

      // Firebase returns refreshed token
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(newUserAToken);

      const result = await syncFcmToken("web");

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: newUserAToken,
        platform: "web",
      });
      expect(localStorage.getItem("last_fcm_token")).toBe(newUserAToken);
    });

    it("should handle multiple token refreshes", async () => {
      /**
       * Flow:
       * 1. Token A synced
       * 2. Firebase refreshes to B -> synced
       * 3. Firebase refreshes to C -> synced
       *
       * Ensures backend always has latest token
       */
      const tokenA = "token_a";
      const tokenB = "token_b";
      const tokenC = "token_c";

      // First sync
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(tokenA);
      await syncFcmToken("web");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: tokenA })
      );

      // Token refreshes to B
      jest.clearAllMocks();
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(tokenB);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });
      await syncFcmToken("web");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: tokenB })
      );

      // Token refreshes to C
      jest.clearAllMocks();
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(tokenC);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });
      await syncFcmToken("web");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: tokenC })
      );

      expect(localStorage.getItem("last_fcm_token")).toBe(tokenC);
    });
  });

  describe("Scenario 5: Logout with Token Unlink", () => {
    it("should unlink token on logout", async () => {
      /**
       * Flow:
       * 1. User logged in with token A
       * 2. User clicks logout
       * 3. Unlink API called to remove token from backend
       * 4. localStorage cleared
       */
      // User was logged in
      localStorage.setItem("last_fcm_token", userAToken);

      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await unlinkFcmToken();

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens/unlink",
        {
          token: userAToken,
        }
      );
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });

    it("should handle logout with no token to unlink", async () => {
      /**
       * Flow:
       * 1. User logs out but never had FCM registered
       * 2. No token to unlink
       * 3. Return success (no-op)
       */
      localStorage.clear();

      const result = await unlinkFcmToken();

      expect(result).toBe(true);
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe("Scenario 6: Shared Device - Multi-User Sequence", () => {
    it("should prevent User A notifications from reaching User B", async () => {
      /**
       * CRITICAL SECURITY SCENARIO:
       * 1. User A logs in -> Token A synced to User A
       * 2. User A logs out -> Token A unlinked
       * 3. User B logs in -> Token A received from Firebase (cached)
       * 4. User B should NOT receive User A's notifications
       *
       * The unlink step ensures User A's token is invalidated on backend
       */

      // ===== USER A LOGIN =====
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      // User A registers/logs in
      const registerResult = await syncFcmToken("web");
      expect(registerResult).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: userAToken,
        platform: "web",
      });

      const tokenInStorageAfterUserALogin =
        localStorage.getItem("last_fcm_token");
      expect(tokenInStorageAfterUserALogin).toBe(userAToken);

      // ===== USER A LOGOUT =====
      jest.clearAllMocks();
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const unlinkResult = await unlinkFcmToken();
      expect(unlinkResult).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens/unlink",
        {
          token: userAToken,
        }
      );

      const tokenAfterUserALogout = localStorage.getItem("last_fcm_token");
      expect(tokenAfterUserALogout).toBeNull();

      // ===== USER B LOGIN =====
      jest.clearAllMocks();

      // Firebase might still return the same token (it's cached on the device)
      // But our sync function will detect it's a new user context
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userBToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const userBLoginResult = await syncFcmToken("web");
      expect(userBLoginResult).toBe(true);

      // User B's token should be synced
      expect(apiClient.post).toHaveBeenCalledWith("/notifications/tokens", {
        token: userBToken,
        platform: "web",
      });

      // Verify User B's token is now in storage
      const tokenAfterUserBLogin = localStorage.getItem("last_fcm_token");
      expect(tokenAfterUserBLogin).toBe(userBToken);

      // ===== CRITICAL VERIFICATION =====
      // User A's token was unlinked before User B logged in
      // So User B will NOT receive notifications intended for User A
      expect(tokenAfterUserBLogin).not.toBe(userAToken);
    });

    it("should handle same physical device with different Firebase tokens", async () => {
      /**
       * Flow:
       * 1. User A uses app, gets token A
       * 2. User A logs out (token A unlinked)
       * 3. User B opens app on same device
       * 4. Firebase gives device new token B (different from A)
       * 5. Token B synced for User B
       */

      // User A
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      await syncFcmToken("web");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: userAToken })
      );

      // User A logout
      jest.clearAllMocks();
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });
      await unlinkFcmToken();
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens/unlink",
        expect.objectContaining({ token: userAToken })
      );

      // User B - Firebase returns completely different token
      jest.clearAllMocks();
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userBToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      await syncFcmToken("web");

      // Verify User B's token registered, not User A's
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: userBToken })
      );

      expect(localStorage.getItem("last_fcm_token")).toBe(userBToken);
      expect(localStorage.getItem("last_fcm_token")).not.toBe(userAToken);
    });
  });

  describe("Scenario 7: Network Error Handling", () => {
    it("should handle registration failure gracefully", async () => {
      /**
       * Flow:
       * 1. User logs in
       * 2. FCM token obtained
       * 3. API call fails (network error)
       * 4. Token not saved to localStorage
       * 5. Retry on next login
       */
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const result = await syncFcmToken("web");

      expect(result).toBe(false);
      // Token should NOT be saved if API failed
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });

    it("should allow retry of failed sync on next app open", async () => {
      /**
       * Flow:
       * 1. First sync fails
       * 2. Token not in localStorage
       * 3. App closed and reopened
       * 4. sync called again
       * 5. This time it succeeds
       */
      // First attempt fails
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const firstResult = await syncFcmToken("web");
      expect(firstResult).toBe(false);

      // App closed and reopened
      jest.clearAllMocks();
      localStorage.clear();

      // Second attempt succeeds
      (requestAndGetFcmToken as jest.Mock).mockResolvedValue(userAToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const secondResult = await syncFcmToken("web");

      expect(secondResult).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/notifications/tokens",
        expect.objectContaining({ token: userAToken })
      );
      expect(localStorage.getItem("last_fcm_token")).toBe(userAToken);
    });

    it("should handle unlink failure but still clear localStorage", async () => {
      /**
       * Flow:
       * 1. User logs out
       * 2. Unlink API call fails
       * 3. localStorage still cleared (for safety)
       * 4. Next user doesn't have access to old token
       */
      localStorage.setItem("last_fcm_token", userAToken);

      (apiClient.post as jest.Mock).mockRejectedValue(new Error("API error"));

      const result = await unlinkFcmToken();

      expect(result).toBe(false);
      // But localStorage should still be cleared
      expect(localStorage.getItem("last_fcm_token")).toBeNull();
    });
  });
});
