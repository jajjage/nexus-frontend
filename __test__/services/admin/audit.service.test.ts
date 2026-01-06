import apiClient from "@/lib/api-client";
import { adminAuditService } from "@/services/admin/audit.service";
import { beforeEach, describe, expect, it, vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminAuditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs", () => {
    it("should call GET /admin/analytics/audit-log with params", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            entries: [
              {
                id: "log-1",
                admin_id: "admin-123",
                action_type: "credit_wallet",
                target_user_id: "user-456",
                old_value: "100.00",
                new_value: "200.00",
                reason: "Refund",
                ip_address: "192.168.1.1",
                metadata: {},
                created_at: "2026-01-05T10:00:00Z",
              },
            ],
            pagination: { total: 1, page: 1, limit: 50, pages: 1 },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await adminAuditService.getAuditLogs({
        page: 1,
        limit: 50,
        actionType: "credit_wallet",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/audit-log",
        { params: { page: 1, limit: 50, actionType: "credit_wallet" } }
      );
      expect(result.data?.entries).toHaveLength(1);
      expect(result.data?.entries[0].action_type).toBe("credit_wallet");
    });

    it("should call GET without params when none provided", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { entries: [], pagination: {} } },
      });

      await adminAuditService.getAuditLogs();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/audit-log",
        { params: undefined }
      );
    });
  });

  describe("exportAuditLogs", () => {
    it("should call GET /admin/analytics/audit-log/export with blob response", async () => {
      const mockBlob = new Blob(["test"], { type: "application/json" });
      mockApiClient.get.mockResolvedValueOnce({ data: mockBlob });

      const result = await adminAuditService.exportAuditLogs({
        fromDate: "2026-01-01",
        toDate: "2026-01-05",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/audit-log/export",
        {
          params: { fromDate: "2026-01-01", toDate: "2026-01-05" },
          responseType: "blob",
        }
      );
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe("getUserActions", () => {
    it("should call GET /admin/analytics/users/:userId/actions", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            userId: "user-123",
            entries: [
              {
                id: "action-1",
                admin_id: "admin-1",
                action_type: "suspend_user",
                target_user_id: "user-123",
              },
            ],
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await adminAuditService.getUserActions("user-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/users/user-123/actions"
      );
      expect(result.data?.userId).toBe("user-123");
    });
  });

  describe("getUserActivity", () => {
    it("should call GET /admin/analytics/users/:userId/activity with params", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            entries: [
              {
                id: "activity-1",
                user_id: "user-123",
                action_type: "login",
                description: "User logged in",
                ip_address: "192.168.1.100",
                user_agent: "Mozilla/5.0",
                created_at: "2026-01-05T10:00:00Z",
              },
            ],
            pagination: { total: 1, page: 1, limit: 10, pages: 1 },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await adminAuditService.getUserActivity("user-123", {
        page: 1,
        limit: 10,
        actionType: "login",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/users/user-123/activity",
        { params: { page: 1, limit: 10, actionType: "login" } }
      );
      expect(result.data?.entries[0].action_type).toBe("login");
    });
  });
});
