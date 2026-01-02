/**
 * Admin Transaction Types
 * Based on ADMIN_GUIDE.md Transaction Management section
 */

// ============= Transaction Types =============

export interface AdminTransaction {
  id: string;
  transactionId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: string;
  direction: "debit" | "credit";
  amount: string;
  balanceBefore?: string;
  balanceAfter?: string;
  reference?: string;
  description?: string;
  status: "pending" | "completed" | "failed";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminTransactionListResponse {
  transactions: AdminTransaction[];
  pagination: TransactionPagination;
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============= Query Params =============

export interface AdminTransactionQueryParams {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  direction?: "debit" | "credit";
  status?: "pending" | "completed" | "failed";
  page?: number;
  limit?: number;
}
