/**
 * Admin Transaction Types
 * Based on actual API response structure
 */

// ============= Embedded Types =============

export interface EmbeddedUser {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

export interface Related {
  id: string;
  external_id?: string;
  user_id?: string;
  recipient_phone?: string;
  operator_id?: string;
  operator_product_id?: string;
  supplier_id?: string;
  supplier_mapping_id?: string;
  amount?: string;
  cost?: string;
  status?: "pending" | "completed" | "failed" | "refunded";
  type?: string;
  attempt_count?: number;
  idempotency_key?: string;
  request_payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  operatorCode?: string;
}

// ============= Transaction Types =============

export interface AdminTransaction {
  id: string;
  walletId?: string;
  transactionId?: string;
  userId: string;
  user?: EmbeddedUser;
  direction: "debit" | "credit";
  amount: number | string;
  balanceAfter?: number | string;
  balanceBefore?: string;
  method?: string;
  reference?: string | null;
  relatedType?: string;
  relatedId?: string;
  related?: Related;
  metadata?: Record<string, unknown>;
  cashbackUsed?: string;
  productCode?: string | null;
  denomAmount?: string | null;
  note?: string | null;
  type?: string;
  description?: string;
  status?: "pending" | "completed" | "failed";
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
