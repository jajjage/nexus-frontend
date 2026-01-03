/**
 * Admin Job Management Hooks
 * React Query hooks for job CRUD operations
 */

"use client";

import { adminJobService } from "@/services/admin/job.service";
import { JobQueryParams } from "@/types/admin/job.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const jobKeys = {
  all: ["admin", "jobs"] as const,
  list: (params?: JobQueryParams) => [...jobKeys.all, "list", params] as const,
  detail: (jobId: string) => [...jobKeys.all, "detail", jobId] as const,
};

/**
 * Fetch paginated list of all jobs
 */
export function useAdminJobs(params?: JobQueryParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => adminJobService.getJobs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch single job details
 */
export function useAdminJob(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => adminJobService.getJobById(jobId),
    enabled: !!jobId,
  });
}

/**
 * Retry a failed job
 */
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => adminJobService.retryJob(jobId),
    onSuccess: (response) => {
      toast.success(response.message || "Job queued for retry");
      // Invalidate both job lists and dashboard failed jobs
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to retry job");
    },
  });
}

/**
 * Delete a failed job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => adminJobService.deleteJob(jobId),
    onSuccess: (response, jobId) => {
      toast.success(response.message || "Job deleted");
      // Invalidate both job lists and dashboard failed jobs
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      // Remove specific job from cache
      queryClient.removeQueries({ queryKey: jobKeys.detail(jobId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to delete job");
    },
  });
}
