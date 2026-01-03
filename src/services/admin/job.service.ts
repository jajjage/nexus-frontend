/**
 * Admin Job Service
 * API methods for job management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import { Job, JobListResponse, JobQueryParams } from "@/types/admin/job.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/jobs";

export const adminJobService = {
  /**
   * Get all jobs with pagination and filtering
   */
  getJobs: async (
    params?: JobQueryParams
  ): Promise<ApiResponse<JobListResponse>> => {
    const response = await apiClient.get<ApiResponse<JobListResponse>>(
      `${BASE_PATH}/all`,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single job by ID
   */
  getJobById: async (jobId: string): Promise<ApiResponse<Job>> => {
    const response = await apiClient.get<ApiResponse<Job>>(
      `${BASE_PATH}/${jobId}`
    );
    return response.data;
  },

  /**
   * Retry a failed job
   * Note: Uses dashboard endpoint as per existing implementation
   */
  retryJob: async (jobId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `/admin/dashboard/failed-jobs/${jobId}/retry`
    );
    return response.data;
  },

  /**
   * Delete a failed job
   * Note: Uses dashboard endpoint as per existing implementation
   */
  deleteJob: async (jobId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/admin/dashboard/failed-jobs/${jobId}`
    );
    return response.data;
  },
};
