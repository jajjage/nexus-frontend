/**
 * Admin Topup Request Types
 * Based on actual API response structure
 */

// ============= Embedded Types =============

export interface EmbeddedUser {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

export interface Operator {
  code: string;
  name: string;
}

export interface TopupResponse {
  id: string;
  status?: string;
  message?: string;
  createdAt?: string;
}

// ============= Topup Request Types =============

export type TopupStatus =
  | "pending"
  | "success"
  | "completed"
  | "failed"
  | "reversed"
  | "retry"
  | "cancelled";

export interface AdminTopupRequest {
  id: string;
  externalId?: string;
  requestId?: string;
  userId: string;
  user?: EmbeddedUser;
  recipientPhone?: string;
  operatorId?: string;
  operatorProductId?: string;
  supplierId?: string;
  supplierMappingId?: string;
  amount: number | string;
  cost?: number | string;
  type?: string;
  status: TopupStatus;
  attemptCount?: number;
  idempotencyKey?: string;
  requestPayload?: Record<string, unknown>;
  operator?: Operator;
  responses?: TopupResponse[];
  provider?: string;
  providerReference?: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface AdminTopupListResponse {
  requests: AdminTopupRequest[];
  pagination: TopupPagination;
}

export interface TopupPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============= Query Params =============

export interface AdminTopupQueryParams {
  userId?: string;
  status?: TopupStatus;
  operator?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
