import apiClient from "@/lib/api-client";
import { adminDashboardService } from "@/services/admin/dashboard.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStats", () => {
    it("should call GET /admin/dashboard/stats", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            totalUsers: 100,
            totalTransactions: 500,
            totalTopupRequests: 50,
          },
        },
      });

      await adminDashboardService.getStats();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/dashboard/stats");
    });
  });

  describe("getFailedJobs", () => {
    it("should call GET /admin/dashboard/failed-jobs with params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            jobs: [],
            pagination: { page: 1, limit: 10, total: 0 },
          },
        },
      });

      await adminDashboardService.getFailedJobs({ page: 1, limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/dashboard/failed-jobs",
        { params: { page: 1, limit: 10 } }
      );
    });
  });

  describe("retryJob", () => {
    it("should call POST /admin/dashboard/failed-jobs/:jobId/retry", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "Job queued for retry" },
      });

      await adminDashboardService.retryJob("job-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/dashboard/failed-jobs/job-123/retry"
      );
    });
  });

  describe("deleteJob", () => {
    it("should call DELETE /admin/dashboard/failed-jobs/:jobId", async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: "Job deleted" },
      });

      await adminDashboardService.deleteJob("job-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/dashboard/failed-jobs/job-123"
      );
    });
  });
});
