export type WithdrawalMethod = "wallet" | "bank";
export type WithdrawalStatus = "pending" | "processing" | "success" | "failed";

export interface WithdrawalCommission {
  commissionId: string;
  amountWithdrawn: number;
  status: string;
}

export interface WalletWithdrawalResponse {
  success: boolean;
  totalWithdrawn: number;
  withdrawals: WithdrawalCommission[];
  message: string;
}

export interface BankWithdrawalRequest {
  amount: number;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string;
  requestNotes?: string;
  specificCommissionIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface WalletWithdrawalRequest {
  amount: number;
  specificCommissionIds?: string[];
}

export interface BankWithdrawalRequestObject {
  id: string;
  agentUserId: string;
  amount: number;
  status: WithdrawalStatus;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string;
  requestNotes?: string;
  adminNotes?: string | null;
  failureReason?: string | null;
  processedBy?: string;
  specificCommissionIds?: string[] | null;
  processedBreakdown?: WithdrawalCommission[] | null;
  metadata?: Record<string, unknown>;
  requestedAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableBalanceResponse {
  availableBalance: number;
  totalCommissions: number;
  pendingWithdrawals: number;
}

export interface BankWithdrawalsListResponse {
  requests: BankWithdrawalRequestObject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminWithdrawalProcessPayload {
  status: "processing" | "success" | "failed";
  adminNotes?: string;
  failureReason?: string;
}
