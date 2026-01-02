/**
 * Admin Topup Request Types
 * Based on ADMIN_GUIDE.md Topup Request Management section
 */

// ============= Topup Request Types =============

export interface AdminTopupRequest {
  id: string;
  requestId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: string;
  status: "pending" | "completed" | "failed" | "cancelled";
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
  status?: "pending" | "completed" | "failed" | "cancelled";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
