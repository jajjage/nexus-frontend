/**
 * Admin Analytics Hooks
 * React Query hooks for analytics dashboard
 */

"use client";

import { adminAnalyticsService } from "@/services/admin/analytics.service";
import {
  DailyMetricsParams,
  DateRangeParams,
  RechartsDataPoint,
} from "@/types/admin/analytics.types";
import { useQuery } from "@tanstack/react-query";

// Query keys for cache management
const analyticsKeys = {
  all: ["admin", "analytics"] as const,
  keyMetrics: () => [...analyticsKeys.all, "key-metrics"] as const,
  userOverview: () => [...analyticsKeys.all, "users", "overview"] as const,
  transactionOverview: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "transactions", "overview", params] as const,
  gmvOverview: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "gmv", "overview", params] as const,
  topupOverview: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "topup", "overview", params] as const,
  walletOverview: () => [...analyticsKeys.all, "wallet", "overview"] as const,
  transactionsByType: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "transactions", "by-type", params] as const,
  // New endpoints
  todaySnapshot: () => [...analyticsKeys.all, "today"] as const,
  dailyMetrics: (params: DailyMetricsParams) =>
    [...analyticsKeys.all, "daily-metrics", params] as const,
  revenue: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "revenue", params] as const,
  operatorPerformance: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "operators", "performance", params] as const,
  userSegments: () => [...analyticsKeys.all, "users", "segments"] as const,
};

/**
 * Fetch key business metrics (ARPU, LTV, Churn, Paying Users)
 * Long cache - 1 hour
 */
export function useKeyMetrics() {
  return useQuery({
    queryKey: analyticsKeys.keyMetrics(),
    queryFn: () => adminAnalyticsService.getKeyMetrics(),
    staleTime: 60 * 60 * 1000, // 1 hour
    select: (data) => data.data,
  });
}

/**
 * Fetch user overview stats
 * Medium cache - 5 minutes
 */
export function useUserOverview() {
  return useQuery({
    queryKey: analyticsKeys.userOverview(),
    queryFn: () => adminAnalyticsService.getUserOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch transaction overview with optional date filtering
 * Medium cache - 5 minutes
 */
export function useTransactionOverview(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.transactionOverview(params),
    queryFn: () => adminAnalyticsService.getTransactionOverview(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch GMV (Gross Merchandise Volume) overview
 * Based on Face Value, not Net Revenue
 * Medium cache - 5 minutes
 */
export function useGmvOverview(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.gmvOverview(params),
    queryFn: () => adminAnalyticsService.getGmvOverview(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch topup/operator performance metrics
 * Medium cache - 5 minutes
 */
export function useTopupOverview(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.topupOverview(params),
    queryFn: () => adminAnalyticsService.getTopupOverview(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch wallet overview
 * Medium cache - 5 minutes
 */
export function useWalletOverview() {
  return useQuery({
    queryKey: analyticsKeys.walletOverview(),
    queryFn: () => adminAnalyticsService.getWalletOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch transactions by type for charts
 * Short cache - 1 minute (not cached on backend)
 */
export function useTransactionsByType(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.transactionsByType(params),
    queryFn: () => adminAnalyticsService.getTransactionsByType(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data.data,
  });
}

// Chart Colors using CSS variables
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Fallback colors if CSS variables not available
export const CHART_COLORS_FALLBACK = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
];

/**
 * Helper to transform operator data for Recharts pie chart
 */
export function transformOperatorDataForChart(
  byOperator: Record<string, number>
): RechartsDataPoint[] {
  return Object.entries(byOperator).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS_FALLBACK[index % CHART_COLORS_FALLBACK.length],
  }));
}

// ============================================================================
// NEW ANALYTICS HOOKS
// ============================================================================

/**
 * Fetch today's snapshot with comparison to yesterday
 * Short cache - 2 minutes (frequently updated)
 */
export function useTodaySnapshot() {
  return useQuery({
    queryKey: analyticsKeys.todaySnapshot(),
    queryFn: () => adminAnalyticsService.getTodaySnapshot(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch daily metrics time series for charts
 * Medium cache - 5 minutes
 */
export function useDailyMetrics(params: DailyMetricsParams) {
  return useQuery({
    queryKey: analyticsKeys.dailyMetrics(params),
    queryFn: () => adminAnalyticsService.getDailyMetrics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

/**
 * Fetch revenue and profit metrics
 * Medium cache - 5 minutes
 */
export function useRevenueMetrics(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: () => adminAnalyticsService.getRevenueMetrics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch operator/supplier performance metrics
 * Medium cache - 5 minutes
 */
export function useOperatorPerformance(params?: DateRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.operatorPerformance(params),
    queryFn: () => adminAnalyticsService.getOperatorPerformance(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

/**
 * Fetch user segments by activity, spend, and registration
 * Longer cache - 10 minutes (changes slowly)
 */
export function useUserSegments() {
  return useQuery({
    queryKey: analyticsKeys.userSegments(),
    queryFn: () => adminAnalyticsService.getUserSegments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.data,
  });
}
