/**
 * Admin Analytics Service
 * API methods for analytics dashboard
 */

import apiClient from "@/lib/api-client";
import {
  ChartData,
  DateRangeParams,
  GmvOverview,
  KeyMetrics,
  TopupOverview,
  TransactionOverview,
  UserOverview,
  WalletOverview,
} from "@/types/admin/analytics.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/analytics";

export const adminAnalyticsService = {
  /**
   * Get key business metrics (ARPU, LTV, Churn, Paying Users)
   * Cached for 1 hour on backend
   */
  getKeyMetrics: async (): Promise<ApiResponse<KeyMetrics>> => {
    const response = await apiClient.get<ApiResponse<KeyMetrics>>(
      `${BASE_PATH}/key-metrics`
    );
    return response.data;
  },

  /**
   * Get user overview stats (growth, activity, suspension)
   * Cached for 5 minutes on backend
   */
  getUserOverview: async (): Promise<ApiResponse<UserOverview>> => {
    const response = await apiClient.get<ApiResponse<UserOverview>>(
      `${BASE_PATH}/users/overview`
    );
    return response.data;
  },

  /**
   * Get transaction overview with optional date filtering
   * Cached for 5 minutes on backend
   */
  getTransactionOverview: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<TransactionOverview>> => {
    const response = await apiClient.get<ApiResponse<TransactionOverview>>(
      `${BASE_PATH}/transactions/overview`,
      { params }
    );
    return response.data;
  },

  /**
   * Get GMV (Gross Merchandise Volume) overview
   * Based on Face Value, not Net Revenue
   */
  getGmvOverview: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<GmvOverview>> => {
    const response = await apiClient.get<ApiResponse<GmvOverview>>(
      `${BASE_PATH}/gmv/overview`,
      { params }
    );
    return response.data;
  },

  /**
   * Get topup/operator performance metrics
   * Cached for 5 minutes on backend
   */
  getTopupOverview: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<TopupOverview>> => {
    const response = await apiClient.get<ApiResponse<TopupOverview>>(
      `${BASE_PATH}/topup/overview`,
      { params }
    );
    return response.data;
  },

  /**
   * Get wallet overview (balances, deposits, withdrawals)
   * Cached for 5 minutes on backend
   */
  getWalletOverview: async (): Promise<ApiResponse<WalletOverview>> => {
    const response = await apiClient.get<ApiResponse<WalletOverview>>(
      `${BASE_PATH}/wallet/overview`
    );
    return response.data;
  },

  /**
   * Get transactions by type for charting
   * Not cached - computed on demand
   */
  getTransactionsByType: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<ChartData>> => {
    const response = await apiClient.get<ApiResponse<ChartData>>(
      `${BASE_PATH}/transactions/by-type`,
      { params }
    );
    return response.data;
  },
};
