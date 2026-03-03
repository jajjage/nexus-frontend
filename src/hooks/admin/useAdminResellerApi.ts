"use client";

import { adminResellerApiService } from "@/services/admin/reseller-api.service";
import {
  AdminResellerPurchaseAnalyticsQueryParams,
  ResellerApiCallbackDeliveriesQueryParams,
} from "@/types/admin/reseller-api.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const resellerApiKeys = {
  all: ["admin", "reseller-api"] as const,
  callbacksOverview: () =>
    [...resellerApiKeys.all, "callbacks-overview"] as const,
  callbackDeliveries: (params?: ResellerApiCallbackDeliveriesQueryParams) =>
    [...resellerApiKeys.all, "callback-deliveries", params] as const,
  circuitBreakers: () => [...resellerApiKeys.all, "circuit-breakers"] as const,
  purchaseAnalyticsOverview: (
    params?: AdminResellerPurchaseAnalyticsQueryParams
  ) => [...resellerApiKeys.all, "purchase-analytics-overview", params] as const,
};

export function useResellerApiCallbacksOverview() {
  return useQuery({
    queryKey: resellerApiKeys.callbacksOverview(),
    queryFn: () => adminResellerApiService.getCallbacksOverview(),
    staleTime: 30 * 1000,
  });
}

export function useResellerApiCallbackDeliveries(
  params?: ResellerApiCallbackDeliveriesQueryParams
) {
  return useQuery({
    queryKey: resellerApiKeys.callbackDeliveries(params),
    queryFn: () => adminResellerApiService.getCallbacksDeliveries(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useResellerApiCircuitBreakers() {
  return useQuery({
    queryKey: resellerApiKeys.circuitBreakers(),
    queryFn: () => adminResellerApiService.getCircuitBreakers(),
    staleTime: 30 * 1000,
  });
}

export function useAdminResellerPurchaseAnalyticsOverview(
  params?: AdminResellerPurchaseAnalyticsQueryParams
) {
  return useQuery({
    queryKey: resellerApiKeys.purchaseAnalyticsOverview(params),
    queryFn: () => adminResellerApiService.getPurchaseAnalyticsOverview(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
