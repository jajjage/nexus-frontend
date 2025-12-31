import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  ClaimReferralBonusResponse,
  GetReferralsParams,
  LinkStats,
  ReferralLinkData,
  ReferralListResponse,
  ReferralStats,
  ValidateReferralCodeResponse,
  Withdrawal,
  WithdrawalBalance,
  WithdrawalRequest,
} from "@/types/referral.types";

export const referralService = {
  // Public Flow: Validate Referral Code
  validateReferralCode: async (
    code: string
  ): Promise<ApiResponse<ValidateReferralCodeResponse>> => {
    const response = await apiClient.get<
      ApiResponse<ValidateReferralCodeResponse>
    >("/referral/code/validate", {
      params: { code },
    });
    return response.data;
  },

  // User Flow: Referral Dashboard

  // 1. Get Referral Statistics
  getReferralStats: async (): Promise<ApiResponse<ReferralStats>> => {
    const response = await apiClient.get<ApiResponse<ReferralStats>>(
      "/dashboard/referrals"
    );
    return response.data;
  },

  // 2. Get User's Referral Link
  getReferralLink: async (): Promise<ApiResponse<ReferralLinkData>> => {
    const response = await apiClient.get<ApiResponse<ReferralLinkData>>(
      "/dashboard/referrals/link"
    );
    return response.data;
  },

  // 3. Manage Referral Link
  regenerateReferralCode: async (): Promise<ApiResponse<ReferralLinkData>> => {
    const response = await apiClient.post<ApiResponse<ReferralLinkData>>(
      "/dashboard/referrals/link/regenerate"
    );
    return response.data;
  },

  deactivateReferralLink: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/dashboard/referrals/link/deactivate"
    );
    return response.data;
  },

  getLinkStats: async (): Promise<ApiResponse<LinkStats>> => {
    const response = await apiClient.get<ApiResponse<LinkStats>>(
      "/dashboard/referrals/link/stats"
    );
    return response.data;
  },

  // 4. List Referrals (History)
  getReferrals: async (
    params?: GetReferralsParams
  ): Promise<ApiResponse<ReferralListResponse>> => {
    const response = await apiClient.get<ApiResponse<ReferralListResponse>>(
      "/dashboard/referrals/list-with-details",
      { params }
    );
    return response.data;
  },

  // 5. Claim Referral Bonus
  claimReferralBonus: async (): Promise<
    ApiResponse<ClaimReferralBonusResponse>
  > => {
    const response = await apiClient.post<
      ApiResponse<ClaimReferralBonusResponse>
    >("/dashboard/referrals/claim");
    return response.data;
  },

  // User Flow: Withdrawals

  // 1. Check Available Balance
  getWithdrawalBalance: async (
    rewardId: string
  ): Promise<ApiResponse<WithdrawalBalance>> => {
    const response = await apiClient.get<ApiResponse<WithdrawalBalance>>(
      `/withdrawals/balance/${rewardId}`
    );
    return response.data;
  },

  // 2. Request Withdrawal
  requestWithdrawal: async (
    data: WithdrawalRequest
  ): Promise<ApiResponse<Withdrawal>> => {
    const response = await apiClient.post<ApiResponse<Withdrawal>>(
      "/withdrawals/request",
      data
    );
    return response.data;
  },

  // 3. Withdrawal History
  getWithdrawalHistory: async (params?: {
    status?: string;
  }): Promise<ApiResponse<Withdrawal[]>> => {
    const response = await apiClient.get<ApiResponse<Withdrawal[]>>(
      "/withdrawals/history",
      { params }
    );
    return response.data;
  },

  // Helper: Get Referral Reward ID
  getReferralRewardId: async (): Promise<string | null> => {
    try {
      // Fetch user's badge/reward summary (single entry)
      const response =
        await apiClient.get<ApiResponse<any>>("/dashboard/rewards");
      // The rewardId is the ID of this summary object
      return response.data.data?.id || null;
    } catch (e) {
      console.warn("Failed to fetch referral reward ID", e);
      return null;
    }
  },
};
