/**
 * Admin Settlement Types
 * Based on ADMIN_GUIDE.md Settlement Management section
 */

// ============= Settlement Entity =============

export interface Settlement {
  id: string;
  providerId: string;
  providerName?: string;
  settlementDate: string;
  amount: number;
  fees: number;
  netAmount: number;
  reference: string;
  rawReport?: Record<string, unknown>;
  status?: "pending" | "completed" | "failed";
  createdAt: string;
  updatedAt?: string;
}

// ============= API Responses =============

export interface SettlementListResponse {
  settlements: Settlement[];
}

// ============= Query Params =============

export interface SettlementQueryParams {
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============= Request Types =============

export interface CreateSettlementRequest {
  providerId: string;
  settlementDate: string;
  amount: number;
  fees: number;
  reference: string;
  rawReport?: Record<string, unknown>;
}
