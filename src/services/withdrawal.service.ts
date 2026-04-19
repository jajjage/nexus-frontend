import apiClient from "@/lib/api-client";
import {
    AdminWithdrawalProcessPayload,
    AvailableBalanceResponse,
    BankWithdrawalRequest,
    BankWithdrawalRequestObject,
    BankWithdrawalsListResponse,
    WalletWithdrawalRequest,
    WalletWithdrawalResponse,
} from "@/types/withdrawal.types";

/**
 * User-facing withdrawal services
 */
export const withdrawalService = {
  /**
   * Get available balance for agent
   */
  getAvailableBalance: () => {
    return apiClient.get<AvailableBalanceResponse>(
      "/dashboard/agent/available-balance"
    );
  },

  /**
   * Withdraw to wallet
   */
  withdrawToWallet: (payload: WalletWithdrawalRequest) => {
    return apiClient.post<WalletWithdrawalResponse>(
      "/dashboard/agent/withdraw",
      {
        method: "wallet",
        ...payload,
      }
    );
  },

  /**
   * Request bank withdrawal
   */
  requestBankWithdrawal: (payload: BankWithdrawalRequest) => {
    return apiClient.post<BankWithdrawalRequestObject>(
      "/dashboard/agent/withdraw",
      {
        method: "bank",
        ...payload,
      }
    );
  },

  /**
   * Get agent bank withdrawal history
   */
  getBankWithdrawals: (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status) params.set("status", status);

    return apiClient.get<BankWithdrawalsListResponse>(
      `/dashboard/agent/bank-withdrawals?${params.toString()}`
    );
  },
};

/**
 * Admin-facing withdrawal services
 */
export const adminWithdrawalService = {
  /**
   * Get all agent bank withdrawals (admin view)
   */
  getBankWithdrawals: (
    page = 1,
    limit = 20,
    status?: string,
    agentUserId?: string
  ) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (agentUserId) params.set("agentUserId", agentUserId);

    return apiClient.get<BankWithdrawalsListResponse>(
      `/dashboard/agents/bank-withdrawals?${params.toString()}`
    );
  },

  /**
   * Process agent bank withdrawal request
   */
  processWithdrawal: (
    withdrawalRequestId: string,
    payload: AdminWithdrawalProcessPayload
  ) => {
    return apiClient.patch<BankWithdrawalRequestObject>(
      `/dashboard/agents/bank-withdrawals/${withdrawalRequestId}`,
      payload
    );
  },
};
