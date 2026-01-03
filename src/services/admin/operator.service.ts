/**
 * Admin Operator Service
 * API methods for operator management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateOperatorRequest,
  Operator,
  OperatorListResponse,
  UpdateOperatorRequest,
} from "@/types/admin/operator.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/operators";

export const adminOperatorService = {
  /**
   * Get all operators
   */
  getOperators: async (): Promise<ApiResponse<OperatorListResponse>> => {
    const response =
      await apiClient.get<ApiResponse<OperatorListResponse>>(BASE_PATH);
    return response.data;
  },

  /**
   * Get a single operator by ID
   */
  getOperatorById: async (
    operatorId: string
  ): Promise<ApiResponse<Operator>> => {
    const response = await apiClient.get<ApiResponse<Operator>>(
      `${BASE_PATH}/${operatorId}`
    );
    return response.data;
  },

  /**
   * Create a new operator
   */
  createOperator: async (
    data: CreateOperatorRequest
  ): Promise<ApiResponse<{ operator: Operator }>> => {
    const response = await apiClient.post<ApiResponse<{ operator: Operator }>>(
      BASE_PATH,
      data
    );
    return response.data;
  },

  /**
   * Update an operator
   */
  updateOperator: async (
    operatorId: string,
    data: UpdateOperatorRequest
  ): Promise<ApiResponse<{ operator: Operator }>> => {
    const response = await apiClient.put<ApiResponse<{ operator: Operator }>>(
      `${BASE_PATH}/${operatorId}`,
      data
    );
    return response.data;
  },
};
