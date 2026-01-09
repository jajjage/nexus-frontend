import { useAdminJob, useAdminJobs } from "@/hooks/admin/useAdminJobs";
import { adminJobService } from "@/services/admin/job.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/job.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminJobService = adminJobService as Mocked<typeof adminJobService>;

describe("Admin Job Hooks", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminJobs", () => {
    const mockJobsResponse = {
      success: true,
      message: "Jobs fetched",
      data: {
        jobs: [
          {
            id: "job-1",
            type: "email",
            status: "completed" as const,
            payload: {},
            attempts: 1,
            maxAttempts: 3,
            createdAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "job-2",
            type: "sms",
            status: "failed" as const,
            payload: {},
            error: "SMS provider error",
            attempts: 3,
            maxAttempts: 3,
            createdAt: "2024-01-02T00:00:00Z",
            failedAt: "2024-01-02T00:05:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    };

    it("should fetch jobs list successfully", async () => {
      mockAdminJobService.getJobs.mockResolvedValue(mockJobsResponse);

      const { result } = renderHook(
        () => useAdminJobs({ page: 1, limit: 10 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockJobsResponse);
      expect(mockAdminJobService.getJobs).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should fetch jobs with status filter", async () => {
      mockAdminJobService.getJobs.mockResolvedValue({
        ...mockJobsResponse,
        data: {
          ...mockJobsResponse.data,
          jobs: [mockJobsResponse.data.jobs[1]], // Only failed job
        },
      });

      const { result } = renderHook(() => useAdminJobs({ status: "failed" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminJobService.getJobs).toHaveBeenCalledWith({
        status: "failed",
      });
    });

    it("should handle fetch error", async () => {
      mockAdminJobService.getJobs.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAdminJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminJob", () => {
    const mockJobResponse = {
      success: true,
      message: "Job fetched",
      data: {
        id: "job-123",
        type: "notification",
        status: "completed" as const,
        payload: { userId: "user-1", message: "Hello" },
        result: { delivered: true },
        attempts: 1,
        maxAttempts: 3,
        createdAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T00:00:05Z",
      },
    };

    it("should fetch single job by ID", async () => {
      mockAdminJobService.getJobById.mockResolvedValue(mockJobResponse);

      const { result } = renderHook(() => useAdminJob("job-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockJobResponse);
      expect(mockAdminJobService.getJobById).toHaveBeenCalledWith("job-123");
    });

    it("should not fetch when jobId is empty", async () => {
      const { result } = renderHook(() => useAdminJob(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAdminJobService.getJobById).not.toHaveBeenCalled();
    });
  });
});
