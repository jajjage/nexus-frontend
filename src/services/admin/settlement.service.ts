/**
 * Admin Settlement Service
 * API methods for settlement management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateSettlementRequest,
  Settlement,
  SettlementListResponse,
  SettlementQueryParams,
} from "@/types/admin/settlement.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/settlements";

export const adminSettlementService = {
  /**
   * Get all settlements with filtering
   */
  getSettlements: async (
    params?: SettlementQueryParams
  ): Promise<ApiResponse<SettlementListResponse>> => {
    const response = await apiClient.get<ApiResponse<SettlementListResponse>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single settlement by ID
   */
  getSettlementById: async (
    settlementId: string
  ): Promise<ApiResponse<Settlement>> => {
    const response = await apiClient.get<ApiResponse<Settlement>>(
      `${BASE_PATH}/${settlementId}`
    );
    return response.data;
  },

  /**
   * Create a new settlement
   */
  createSettlement: async (
    data: CreateSettlementRequest
  ): Promise<ApiResponse<{ settlement: Settlement }>> => {
    const response = await apiClient.post<
      ApiResponse<{ settlement: Settlement }>
    >(BASE_PATH, data);
    return response.data;
  },
};
