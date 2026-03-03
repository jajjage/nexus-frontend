import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  ResellerApiCallbackDeliveriesQueryParams,
  ResellerApiCallbackDeliveriesResponse,
  ResellerApiCallbacksOverview,
  ResellerApiCircuitBreakersResponse,
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
    const breakers = Array.isArray(raw.breakers)
      ? raw.breakers.map((item: any) => ({
          supplier: item?.supplier ?? item?.supplierName ?? "Unknown",
          state: item?.state ?? "closed",
          failureCount: item?.failureCount ?? item?.failure_count ?? 0,
          successCount: item?.successCount ?? item?.success_count ?? 0,
          openedAt: item?.openedAt ?? item?.opened_at ?? null,
          lastFailureAt: item?.lastFailureAt ?? item?.last_failure_at ?? null,
          nextAttemptAt: item?.nextAttemptAt ?? item?.next_attempt_at ?? null,
        }))
      : [];

    return {
      ...response.data,
      data: { breakers },
    };
  },
};
