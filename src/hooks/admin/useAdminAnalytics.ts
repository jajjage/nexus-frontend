/**
 * Admin Analytics Hooks
 * React Query hooks for analytics dashboard
 */

"use client";

import { adminAnalyticsService } from "@/services/admin/analytics.service";
import {
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
  topupOverview: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "topup", "overview", params] as const,
  walletOverview: () => [...analyticsKeys.all, "wallet", "overview"] as const,
  transactionsByType: (params?: DateRangeParams) =>
    [...analyticsKeys.all, "transactions", "by-type", params] as const,
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
