import { referralService } from "@/services/referral.service";
import { GetReferralsParams, WithdrawalRequest } from "@/types/referral.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// ============= Query Keys =============
export const referralKeys = {
  all: ["referrals"] as const,
  stats: () => [...referralKeys.all, "stats"] as const,
  link: () => [...referralKeys.all, "link"] as const,
  linkStats: () => [...referralKeys.link(), "stats"] as const,
  list: (params?: GetReferralsParams) =>
    [...referralKeys.all, "list", params] as const,
  withdrawals: {
    all: () => [...referralKeys.all, "withdrawals"] as const,
    balance: (rewardId: string) =>
      [...referralKeys.withdrawals.all(), "balance", rewardId] as const,
    history: (status?: string) =>
      [...referralKeys.withdrawals.all(), "history", status] as const,
  },
  rewardId: () => [...referralKeys.all, "rewardId"] as const,
};

// ============= Referral Queries =============

/**
 * Get referral statistics
 */
export const useReferralStats = () => {
  return useQuery({
    queryKey: referralKeys.stats(),
    queryFn: async () => {
      const response = await referralService.getReferralStats();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get user's referral link data
 */
export const useReferralLink = () => {
  return useQuery({
    queryKey: referralKeys.link(),
    queryFn: async () => {
      const response = await referralService.getReferralLink();
      return response.data;
    },
    staleTime: Infinity, // Link rarely changes
  });
};

/**
 * Get referral link statistics
 */
export const useLinkStats = () => {
  return useQuery({
    queryKey: referralKeys.linkStats(),
    queryFn: async () => {
      const response = await referralService.getLinkStats();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get list of referrals
 */
export const useReferralsList = (params?: GetReferralsParams) => {
  return useQuery({
    queryKey: referralKeys.list(params),
    queryFn: async () => {
      const response = await referralService.getReferrals(params);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Get Referral Reward ID
 */
export const useReferralRewardId = () => {
  return useQuery({
    queryKey: referralKeys.rewardId(),
    queryFn: async () => {
      return await referralService.getReferralRewardId();
    },
    staleTime: Infinity,
  });
};

// ============= Referral Mutations =============

/**
 * Regenerate referral code
 */
export const useRegenerateReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => referralService.regenerateReferralCode(),
    onSuccess: (data) => {
      queryClient.setQueryData(referralKeys.link(), data.data);
      toast.success("Referral code regenerated successfully");
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to regenerate referral code"
      );
    },
  });
};

/**
 * Deactivate referral link
 */
export const useDeactivateReferralLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => referralService.deactivateReferralLink(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.link() });
      toast.success("Referral link deactivated");
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to deactivate referral link"
      );
    },
  });
};

/**
 * Claim referral bonus
 */
export const useClaimReferralBonus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => referralService.claimReferralBonus(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: referralKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ["wallet"] }); // Update wallet balance if applicable
      toast.success(data.message || "Referral bonus claimed successfully!");
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to claim referral bonus"
      );
    },
  });
};

/**
 * Validate referral code (Public)
 */
export const useValidateReferralCode = () => {
  return useMutation({
    mutationFn: (code: string) => referralService.validateReferralCode(code),
  });
};

// ============= Withdrawal Queries & Mutations =============

/**
 * Get withdrawal balance
 */
export const useWithdrawalBalance = (rewardId: string) => {
  return useQuery({
    queryKey: referralKeys.withdrawals.balance(rewardId),
    queryFn: async () => {
      const response = await referralService.getWithdrawalBalance(rewardId);
      return response.data;
    },
    enabled: !!rewardId,
  });
};

/**
 * Get withdrawal history
 */
export const useWithdrawalHistory = (status?: string) => {
  return useQuery({
    queryKey: referralKeys.withdrawals.history(status),
    queryFn: async () => {
      const response = await referralService.getWithdrawalHistory({ status });
      return response.data;
    },
  });
};

/**
 * Request withdrawal
 */
export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawalRequest) =>
      referralService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: referralKeys.withdrawals.all(),
      });
      // Invalidate stats as potential earnings changed
      queryClient.invalidateQueries({ queryKey: referralKeys.stats() });
      toast.success("Withdrawal request submitted successfully");
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to submit withdrawal request"
      );
    },
  });
};
