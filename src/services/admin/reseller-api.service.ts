import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  AdminResellerPurchaseAnalytics,
  AdminResellerPurchaseAnalyticsQueryParams,
  ResellerApiCallbackDeliveriesQueryParams,
  ResellerApiCallbackDeliveriesResponse,
  ResellerApiCallbacksOverview,
  ResellerApiCircuitBreakersResponse,
  ResetCircuitBreakerPayload,
  ToggleCircuitBreakerPayload,
} from "@/types/admin/reseller-api.types";

const BASE_PATH = "/admin/reseller-api";

const mapPagination = (raw: any) => ({
  page: raw?.page ?? 1,
  limit: raw?.limit ?? 15,
  total: raw?.total ?? 0,
  totalPages: raw?.totalPages ?? raw?.total_pages ?? 1,
  hasNextPage: Boolean(raw?.hasNextPage ?? raw?.has_next_page ?? false),
  hasPrevPage: Boolean(raw?.hasPrevPage ?? raw?.has_prev_page ?? false),
});

const mapDelivery = (raw: any) => ({
  id: raw?.id ?? "",
  requestId: raw?.requestId ?? raw?.request_id ?? "",
  resellerId: raw?.resellerId ?? raw?.reseller_id,
  callbackUrl: raw?.callbackUrl ?? raw?.callback_url ?? "",
  status: raw?.status ?? "pending",
  attemptCount: raw?.attemptCount ?? raw?.attempt_count ?? 0,
  httpStatus: raw?.httpStatus ?? raw?.http_status,
  latencyMs: raw?.latencyMs ?? raw?.latency_ms,
  errorMessage: raw?.errorMessage ?? raw?.error_message,
  createdAt: raw?.createdAt ?? raw?.created_at ?? new Date(0).toISOString(),
  deliveredAt: raw?.deliveredAt ?? raw?.delivered_at ?? null,
});

const mapStatusBreakdown = (
  raw: any
): AdminResellerPurchaseAnalytics["breakdownByStatus"] => ({
  success: Number(raw?.success ?? 0),
  failed: Number(raw?.failed ?? 0),
  pending: Number(raw?.pending ?? 0),
  reversed: Number(raw?.reversed ?? 0),
});

const mapPurchaseAnalytics = (raw: any): AdminResellerPurchaseAnalytics => ({
  period: {
    fromDate: raw?.period?.fromDate ?? raw?.period?.from_date ?? null,
    toDate: raw?.period?.toDate ?? raw?.period?.to_date ?? null,
  },
  scope: {
    userId: raw?.scope?.userId ?? raw?.scope?.user_id ?? null,
  },
  totals: {
    totalRequests: Number(
      raw?.totals?.totalRequests ?? raw?.totals?.total_requests ?? 0
    ),
    totalAmount: Number(
      raw?.totals?.totalAmount ?? raw?.totals?.total_amount ?? 0
    ),
  },
  breakdownByStatus: mapStatusBreakdown(
    raw?.breakdownByStatus ?? raw?.breakdown_by_status
  ),
  amountByStatus: mapStatusBreakdown(
    raw?.amountByStatus ?? raw?.amount_by_status
  ),
  derived: {
    successRate: String(
      raw?.derived?.successRate ?? raw?.derived?.success_rate ?? "0%"
    ),
  },
});

export const adminResellerApiService = {
  getCallbacksOverview: async (): Promise<
    ApiResponse<ResellerApiCallbacksOverview>
  > => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_PATH}/callbacks/overview`
    );
    const raw = response.data?.data ?? {};

    return {
      ...response.data,
      data: {
        total: raw.total ?? 0,
        delivered: raw.delivered ?? 0,
        failed: raw.failed ?? 0,
        pending: raw.pending ?? 0,
        successRate: raw.successRate ?? raw.success_rate,
        avgLatencyMs: raw.avgLatencyMs ?? raw.avg_latency_ms,
      },
    };
  },

  getCallbacksDeliveries: async (
    params?: ResellerApiCallbackDeliveriesQueryParams
  ): Promise<ApiResponse<ResellerApiCallbackDeliveriesResponse>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_PATH}/callbacks/deliveries`,
      { params }
    );
    const raw = response.data?.data ?? {};

    const deliveries = Array.isArray(raw.deliveries)
      ? raw.deliveries.map(mapDelivery)
      : [];

    return {
      ...response.data,
      data: {
        deliveries,
        pagination: mapPagination(raw.pagination ?? raw),
      },
    };
  },

  getCircuitBreakers: async (): Promise<
    ApiResponse<ResellerApiCircuitBreakersResponse>
  > => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_PATH}/circuit-breakers`
    );
    const raw = response.data?.data ?? {};
    const rawList = Array.isArray(raw.suppliers)
      ? raw.suppliers
      : Array.isArray(raw.breakers)
        ? raw.breakers
        : [];

    const breakers = rawList.map((item: any) => {
      const circuit = item?.circuit ?? {};
      return {
        supplier:
          item?.supplierName ||
          item?.supplier ||
          item?.supplierKey ||
          item?.supplierSlug ||
          "Unknown",
        supplierKey:
          item?.supplierKey || item?.supplierSlug || item?.id || "default",
        supplierSlug: item?.supplierSlug || null,
        supplierName: item?.supplierName || item?.supplier || null,
        state: (circuit.state || item?.state || "closed").toLowerCase(),
        failureCount: Number(
          circuit.failureCount ?? item?.failureCount ?? item?.failure_count ?? 0
        ),
        successCount: Number(
          circuit.successCount ?? item?.successCount ?? item?.success_count ?? 0
        ),
        openedAt: circuit.openedAt
          ? new Date(circuit.openedAt).toISOString()
          : item?.openedAt
            ? new Date(item.openedAt).toISOString()
            : null,
        lastFailureAt: circuit.lastFailureTime
          ? new Date(circuit.lastFailureTime).toISOString()
          : item?.lastFailureAt
            ? new Date(item.lastFailureAt).toISOString()
            : null,
        lastFailureReason:
          circuit.lastFailureReason || item?.lastFailureReason || null,
        recoveryReady: Boolean(
          circuit.recoveryReady ?? item?.recoveryReady ?? false
        ),
        blockingRequests: Boolean(
          circuit.blockingRequests ?? item?.blockingRequests ?? false
        ),
      };
    });

    return {
      ...response.data,
      data: { breakers },
    };
  },

  resetCircuitBreaker: async (
    payload?: ResetCircuitBreakerPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${BASE_PATH}/circuit-breakers/reset`,
      payload ?? {}
    );
    return response.data;
  },

  toggleCircuitBreaker: async (
    payload: ToggleCircuitBreakerPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${BASE_PATH}/circuit-breakers/toggle`,
      payload
    );
    return response.data;
  },

  getPurchaseAnalyticsOverview: async (
    params?: AdminResellerPurchaseAnalyticsQueryParams
  ): Promise<ApiResponse<AdminResellerPurchaseAnalytics>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      "/admin/analytics/reseller-api/purchases/overview",
      { params }
    );

    return {
      ...response.data,
      data: mapPurchaseAnalytics(response.data?.data ?? {}),
    };
  },
};
