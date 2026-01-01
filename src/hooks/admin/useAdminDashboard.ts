/**
 * Admin Dashboard Hooks
 * React Query hooks for dashboard stats and failed jobs
 */

"use client";

import { adminDashboardService } from "@/services/admin/dashboard.service";
import { FailedJobsParams } from "@/types/admin/dashboard.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys for cache management
const dashboardKeys = {
  all: ["admin", "dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  failedJobs: (params?: FailedJobsParams) =>
    [...dashboardKeys.all, "failed-jobs", params] as const,
};

/**
 * Fetch dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => adminDashboardService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * Fetch failed jobs with pagination
 */
export function useFailedJobs(params?: FailedJobsParams) {
  return useQuery({
    queryKey: dashboardKeys.failedJobs(params),
    queryFn: () => adminDashboardService.getFailedJobs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Retry a failed job
 */
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => adminDashboardService.retryJob(jobId),
    onSuccess: (response) => {
      toast.success(response.message || "Job queued for retry");
      queryClient.invalidateQueries({ queryKey: dashboardKeys.failedJobs() });
    },
    onError: () => {
      toast.error("Failed to retry job");
    },
  });
}

/**
 * Delete a failed job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => adminDashboardService.deleteJob(jobId),
    onSuccess: (response) => {
      toast.success(response.message || "Job deleted");
      queryClient.invalidateQueries({ queryKey: dashboardKeys.failedJobs() });
    },
    onError: () => {
      toast.error("Failed to delete job");
    },
  });
}
