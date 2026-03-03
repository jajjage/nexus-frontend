export interface ResellerApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ResellerApiCallbacksOverview {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  successRate?: number;
  avgLatencyMs?: number;
}

export type ResellerApiCallbackDeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "retrying"
  | string;

export interface ResellerApiCallbackDelivery {
  id: string;
  requestId: string;
  resellerId?: string;
  callbackUrl: string;
  status: ResellerApiCallbackDeliveryStatus;
  attemptCount: number;
  httpStatus?: number | null;
  latencyMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
}

export interface ResellerApiCallbackDeliveriesResponse {
  deliveries: ResellerApiCallbackDelivery[];
  pagination: ResellerApiPagination;
}

export interface ResellerApiCallbackDeliveriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResellerApiCircuitBreaker {
  supplier: string;
  state: "closed" | "open" | "half_open" | string;
  failureCount: number;
  successCount: number;
  openedAt?: string | null;
  lastFailureAt?: string | null;
  nextAttemptAt?: string | null;
}

export interface ResellerApiCircuitBreakersResponse {
  breakers: ResellerApiCircuitBreaker[];
}
