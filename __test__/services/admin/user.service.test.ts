import apiClient from "@/lib/api-client";
import { adminUserService } from "@/services/admin/user.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should call GET /admin/users with pagination params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            users: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        },
      });

      await adminUserService.getUsers({ page: 1, limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/users", {
        params: { page: 1, limit: 10 },
      });
    });
  });

  describe("getUserById", () => {
    it("should call GET /admin/users/:userId", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { id: "user-123" } },
      });

      await adminUserService.getUserById("user-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/users/user-123");
    });
  });

  describe("createUser", () => {
    it("should call POST /admin/users with user data", async () => {
      const userData = {
        email: "newuser@test.com",
        password: "password123",
        phoneNumber: "08012345678",
        fullName: "New User",
        role: "user" as const,
      };
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { id: "new-user-id" } },
      });

      await adminUserService.createUser(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith("/admin/users", userData);
    });
  });

  describe("updateUser", () => {
    it("should call PUT /admin/users/:userId with update data", async () => {
      const updateData = { fullName: "Updated Name" };
      mockApiClient.put.mockResolvedValueOnce({
        data: { success: true, data: { id: "user-123" } },
      });

      await adminUserService.updateUser("user-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/users/user-123",
        updateData
      );
    });
  });

  describe("suspendUser", () => {
    it("should call POST /admin/users/:userId/suspend", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "User suspended" },
      });

      await adminUserService.suspendUser("user-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/users/user-123/suspend"
      );
    });
  });

  describe("unsuspendUser", () => {
    it("should call POST /admin/users/:userId/unsuspend", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "User unsuspended" },
      });

      await adminUserService.unsuspendUser("user-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/users/user-123/unsuspend"
      );
    });
  });

  describe("creditWallet", () => {
    it("should call POST /admin/users/:userId/credit with amount", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { newBalance: 150 } },
      });

      await adminUserService.creditWallet("user-123", { amount: 100 });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/users/user-123/credit",
        { amount: 100 }
      );
    });
  });

  describe("debitWallet", () => {
    it("should call POST /admin/users/:userId/debit with amount", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { newBalance: 50 } },
      });

      await adminUserService.debitWallet("user-123", { amount: 50 });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/users/user-123/debit",
        { amount: 50 }
      );
    });
  });

  describe("disable2FA", () => {
    it("should call POST /admin/users/:userId/2fa/disable", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "2FA disabled" },
      });

      await adminUserService.disable2FA("user-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/users/user-123/2fa/disable"
      );
    });
  });

  describe("getUserSessions", () => {
    it("should call GET /admin/users/:userId/sessions", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { sessions: [] } },
      });

      await adminUserService.getUserSessions("user-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/users/user-123/sessions"
      );
    });
  });

  describe("revokeUserSessions", () => {
    it("should call DELETE /admin/users/:userId/sessions", async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: { success: true, data: { sessionsRevoked: 3 } },
      });

      await adminUserService.revokeUserSessions("user-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/users/user-123/sessions"
      );
    });
  });
});
