/**
 * Admin Analytics Service
 * API methods for analytics dashboard
 */

import apiClient from "@/lib/api-client";
import {
  ChartData,
  DailyMetric,
  DailyMetricsParams,
  DateRangeParams,
  GmvOverview,
  KeyMetrics,
  OperatorPerformance,
  RevenueMetrics,
  TodaySnapshot,
  TopupOverview,
  TransactionOverview,
  UserOverview,
  UserSegments,
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

  // ============================================================================
  // NEW ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get today's snapshot with comparison to yesterday
   * Cached for 2 minutes on backend
   */
  getTodaySnapshot: async (): Promise<ApiResponse<TodaySnapshot>> => {
    const response = await apiClient.get<ApiResponse<TodaySnapshot>>(
      `${BASE_PATH}/today`
    );
    return response.data;
  },

  /**
   * Get daily metrics time series for charts
   * Supports granularity: day, week, month
   */
  getDailyMetrics: async (
    params: DailyMetricsParams
  ): Promise<ApiResponse<DailyMetric[]>> => {
    const response = await apiClient.get<ApiResponse<DailyMetric[]>>(
      `${BASE_PATH}/daily-metrics`,
      { params }
    );
    return response.data;
  },

  /**
   * Get revenue and profit metrics
   */
  getRevenueMetrics: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<RevenueMetrics>> => {
    const response = await apiClient.get<ApiResponse<RevenueMetrics>>(
      `${BASE_PATH}/revenue`,
      { params }
    );
    return response.data;
  },

  /**
   * Get operator/supplier performance metrics
   */
  getOperatorPerformance: async (
    params?: DateRangeParams
  ): Promise<ApiResponse<OperatorPerformance>> => {
    const response = await apiClient.get<ApiResponse<OperatorPerformance>>(
      `${BASE_PATH}/operators/performance`,
      { params }
    );
    return response.data;
  },

  /**
   * Get user segments by activity, spend, and registration
   */
  getUserSegments: async (): Promise<ApiResponse<UserSegments>> => {
    const response = await apiClient.get<ApiResponse<UserSegments>>(
      `${BASE_PATH}/users/segments`
    );
    return response.data;
  },
};
