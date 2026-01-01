/**
 * Admin Dashboard Service
 * API methods for dashboard stats and analytics
 */

import apiClient from "@/lib/api-client";
import {
  DashboardStats,
  FailedJobsParams,
  FailedJobsResponse,
} from "@/types/admin/dashboard.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/dashboard";

export const adminDashboardService = {
  /**
   * Get dashboard stats (total users, transactions, topup requests)
   */
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      `${BASE_PATH}/stats`
    );
    return response.data;
  },

  /**
   * Get failed jobs with pagination
   */
  getFailedJobs: async (
    params?: FailedJobsParams
  ): Promise<ApiResponse<FailedJobsResponse>> => {
    const response = await apiClient.get<ApiResponse<FailedJobsResponse>>(
      `${BASE_PATH}/failed-jobs`,
      { params }
    );
    return response.data;
  },

  /**
   * Retry a failed job
   */
  retryJob: async (jobId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/failed-jobs/${jobId}/retry`
    );
    return response.data;
  },

  /**
   * Delete a failed job
   */
  deleteJob: async (jobId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `${BASE_PATH}/failed-jobs/${jobId}`
    );
    return response.data;
  },
};
