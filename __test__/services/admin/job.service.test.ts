import apiClient from "@/lib/api-client";
import { adminJobService } from "@/services/admin/job.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminJobService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getJobs", () => {
    it("should call GET /admin/jobs/all without params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            jobs: [],
            pagination: { page: 1, limit: 10, total: 0 },
          },
        },
      });

      await adminJobService.getJobs();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/jobs/all", {
        params: undefined,
      });
    });

    it("should call GET /admin/jobs/all with pagination params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            jobs: [],
            pagination: { page: 2, limit: 20, total: 50 },
          },
        },
      });

      await adminJobService.getJobs({ page: 2, limit: 20 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/jobs/all", {
        params: { page: 2, limit: 20 },
      });
    });

    it("should call GET /admin/jobs/all with status filter", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { jobs: [], pagination: {} },
        },
      });

      await adminJobService.getJobs({ status: "failed" });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/jobs/all", {
        params: { status: "failed" },
      });
    });
  });

  describe("getJobById", () => {
    it("should call GET /admin/jobs/:jobId", async () => {
      const mockJob = {
        id: "job-123",
        type: "email",
        status: "completed",
        attempts: 1,
        maxAttempts: 3,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockJob,
        },
      });

      const result = await adminJobService.getJobById("job-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/jobs/job-123");
      expect(result.data).toEqual(mockJob);
    });
  });

  describe("retryJob", () => {
    it("should call POST /admin/dashboard/failed-jobs/:jobId/retry", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: "Job queued for retry" },
      });

      await adminJobService.retryJob("job-456");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/dashboard/failed-jobs/job-456/retry"
      );
    });
  });

  describe("deleteJob", () => {
    it("should call DELETE /admin/dashboard/failed-jobs/:jobId", async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: "Job deleted" },
      });

      await adminJobService.deleteJob("job-789");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/dashboard/failed-jobs/job-789"
      );
    });
  });
});
