/**
 * Supplier Error Analytics Types
 */

export interface SupplierErrorLog {
  id: string;
  supplier_slug: string;
  topup_request_id?: string | null;
  bill_payment_id?: string | null;
  error_type: "infrastructure" | "business_logic" | "supplier_resource";
  status_code?: number | null;
  provider_code?: string | null;
  raw_message: string;
  user_friendly_message: string;
  layman_explanation: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface SupplierErrorsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SupplierErrorsListResponse {
  entries: SupplierErrorLog[];
  pagination: SupplierErrorsPagination;
}

export interface SupplierErrorStats {
  totalErrors: number;
  errorsBySupplier: Record<string, number>;
  errorsByType: Record<string, number>;
  dailyTrends: Array<{ date: string; count: number }>;
}

export interface SupplierErrorsQueryParams {
  page?: number;
  limit?: number;
  supplierSlug?: string;
  errorType?: string;
  fromDate?: string;
  toDate?: string;
}
