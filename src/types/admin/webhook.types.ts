/**
 * Webhook Reconciliation Types
 * Types for webhook reconciliation admin panel
 */

// Webhook reconciliation status
export type WebhookStatus =
  | "MATCHED"
  | "UNMATCHED"
  | "PENDING"
  | "REVIEWED"
  | "FAILED";

// Single webhook reconciliation record
export interface WebhookReconciliationRecord {
  id: string;
  provider: string;
  supplierName: string;
  externalReference: string;
  internalReference?: string;
  status: WebhookStatus;
  amount: number;
  phoneNumber?: string;
  productCode?: string;
  payload: Record<string, unknown>;
  matchedTopupId?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Stats response
export interface WebhookStats {
  total: number;
  matched: number;
  unmatched: number;
  pending: number;
  reviewed: number;
  failed: number;
  bySupplier: Record<string, number>;
  byStatus: Record<WebhookStatus, number>;
}

// Query params for filtering
export interface WebhookQueryParams {
  page?: number;
  limit?: number;
  status?: WebhookStatus;
  supplier?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// List response
export interface WebhookListResponse {
  webhooks: WebhookReconciliationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Match request
export interface MatchWebhookRequest {
  topupRequestId: string;
}

// Review request
export interface ReviewWebhookRequest {
  notes?: string;
  action: "approve" | "reject" | "flag";
}
