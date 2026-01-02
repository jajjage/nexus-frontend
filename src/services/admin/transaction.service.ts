/**
 * Admin Transaction Service
 * API methods for transaction management
 */

import apiClient from "@/lib/api-client";
import {
  AdminTransaction,
  AdminTransactionListResponse,
  AdminTransactionQueryParams,
} from "@/types/admin/transaction.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/transactions";

export const adminTransactionService = {
  /**
   * Get all transactions with filtering and pagination
   */
  getTransactions: async (
    params?: AdminTransactionQueryParams
  ): Promise<ApiResponse<AdminTransactionListResponse>> => {
    const response = await apiClient.get<
      ApiResponse<AdminTransactionListResponse>
    >(BASE_PATH, { params });
    return response.data;
  },

  /**
   * Get a single transaction by ID
   */
  getTransactionById: async (
    transactionId: string
  ): Promise<ApiResponse<{ transaction: AdminTransaction }>> => {
    const response = await apiClient.get<
      ApiResponse<{ transaction: AdminTransaction }>
    >(`${BASE_PATH}/${transactionId}`);
    return response.data;
  },
};
