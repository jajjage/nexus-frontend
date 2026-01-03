/**
 * Admin Topup Request Service
 * API methods for topup request management
 */

import apiClient from "@/lib/api-client";
import {
  AdminTopupListResponse,
  AdminTopupQueryParams,
  AdminTopupRequest,
} from "@/types/admin/topup.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/topup-requests";

export const adminTopupService = {
  /**
   * Get all topup requests with filtering and pagination
   */
  getTopupRequests: async (
    params?: AdminTopupQueryParams
  ): Promise<ApiResponse<AdminTopupListResponse>> => {
    const response = await apiClient.get<ApiResponse<AdminTopupListResponse>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single topup request by ID
   */
  getTopupRequestById: async (
    requestId: string
  ): Promise<ApiResponse<AdminTopupRequest>> => {
    const response = await apiClient.get<ApiResponse<AdminTopupRequest>>(
      `${BASE_PATH}/${requestId}`
    );
    return response.data;
  },

  /**
   * Retry a failed topup request
   */
  retryTopupRequest: async (requestId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${requestId}/retry`
    );
    return response.data;
  },
};
