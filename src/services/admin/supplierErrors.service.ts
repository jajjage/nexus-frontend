/**
 * Admin Supplier Errors Service
 * API methods for supplier error logs and analytics
 */

import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  SupplierErrorsListResponse,
  SupplierErrorStats,
  SupplierErrorsQueryParams,
} from "@/types/admin/supplierErrors.types";

const BASE_PATH = "/admin/analytics";

export const adminSupplierErrorsService = {
  /**
   * Get paginated supplier error logs
   */
  getLogs: async (
    params?: SupplierErrorsQueryParams
  ): Promise<ApiResponse<SupplierErrorsListResponse>> => {
    const response = await apiClient.get<
      ApiResponse<SupplierErrorsListResponse>
    >(`${BASE_PATH}/supplier-errors`, { params });
    return response.data;
  },

  /**
   * Get supplier error analytics stats
   */
  getStats: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResponse<SupplierErrorStats>> => {
    const response = await apiClient.get<ApiResponse<SupplierErrorStats>>(
      `${BASE_PATH}/supplier-errors/stats`,
      { params }
    );
    return response.data;
  },
};
