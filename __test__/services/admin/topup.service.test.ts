import apiClient from "@/lib/api-client";
import { adminTopupService } from "@/services/admin/topup.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminTopupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTopupRequests", () => {
    it("should call GET /admin/topup-requests with no params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            requests: [],
            pagination: { page: 1, limit: 10, total: 0 },
          },
        },
      });

      await adminTopupService.getTopupRequests();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/topup-requests", {
        params: undefined,
      });
    });

    it("should call GET /admin/topup-requests with status filter", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { requests: [], pagination: {} },
        },
      });

      await adminTopupService.getTopupRequests({
        page: 1,
        limit: 10,
        status: "pending",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/topup-requests", {
        params: {
          page: 1,
          limit: 10,
          status: "pending",
        },
      });
    });
  });

  describe("getTopupRequestById", () => {
    it("should call GET /admin/topup-requests/:requestId", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            request: {
              id: "req-123",
              amount: "1000",
              status: "pending",
            },
          },
        },
      });

      await adminTopupService.getTopupRequestById("req-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/topup-requests/req-123"
      );
    });
  });

  describe("retryTopupRequest", () => {
    it("should call POST /admin/topup-requests/:requestId/retry", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "Topup retry initiated" },
      });

      await adminTopupService.retryTopupRequest("req-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/topup-requests/req-123/retry"
      );
    });
  });
});
