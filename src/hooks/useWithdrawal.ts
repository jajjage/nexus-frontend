import {
  adminWithdrawalService,
  withdrawalService,
} from "@/services/withdrawal.service";
import {
  AdminWithdrawalProcessPayload,
  BankWithdrawalRequest,
  WalletWithdrawalRequest,
} from "@/types/withdrawal.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Query key factory for withdrawal queries
 */
export const withdrawalKeys = {
  all: ["withdrawal"],
  balance: () => [...withdrawalKeys.all, "balance"],
  bankRequests: (params?: unknown) => [
    ...withdrawalKeys.all,
    "bank-requests",
    params,
  ],
  adminBankRequests: (params?: unknown) => [
    ...withdrawalKeys.all,
    "admin-bank-requests",
    params,
  ],
};

/**
 * Hook to fetch available balance
 */
export const useAvailableBalance = () => {
  return useQuery({
    queryKey: withdrawalKeys.balance(),
    queryFn: async () => {
      const response = await withdrawalService.getAvailableBalance();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to withdraw to wallet
 */
export const useWalletWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WalletWithdrawalRequest) =>
      withdrawalService.withdrawToWallet(payload),
    onSuccess: () => {
      // Invalidate balance and other related queries
      queryClient.invalidateQueries({
        queryKey: withdrawalKeys.balance(),
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-stats"], // Invalidate agent stats if it exists
      });
      queryClient.invalidateQueries({
        queryKey: ["agent", "commissions"], // Invalidate commissions
      });
    },
  });
};

/**
 * Hook to request bank withdrawal
 */
export const useBankWithdrawalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BankWithdrawalRequest) =>
      withdrawalService.requestBankWithdrawal(payload),
    onSuccess: () => {
      // Invalidate bank requests and balance
      queryClient.invalidateQueries({
        queryKey: withdrawalKeys.bankRequests(),
      });
      queryClient.invalidateQueries({
        queryKey: withdrawalKeys.balance(),
      });
      // Also invalidate admin list so they see the new withdrawal
      queryClient.invalidateQueries({
        queryKey: withdrawalKeys.adminBankRequests(),
      });
    },
  });
};

/**
 * Hook to fetch bank withdrawal history
 */
export const useBankWithdrawals = (page = 1, limit = 20, status?: string) => {
  const params = { page, limit, status };

  return useQuery({
    queryKey: withdrawalKeys.bankRequests(params),
    queryFn: async () => {
      const response = await withdrawalService.getBankWithdrawals(
        page,
        limit,
        status
      );
      return response.data;
    },
    enabled: true,
  });
};

/**
 * Admin hook to fetch all bank withdrawals
 */
export const useAdminBankWithdrawals = (
  page = 1,
  limit = 20,
  status?: string,
  agentUserId?: string
) => {
  const params = { page, limit, status, agentUserId };

  return useQuery({
    queryKey: withdrawalKeys.adminBankRequests(params),
    queryFn: async () => {
      const response = await adminWithdrawalService.getBankWithdrawals(
        page,
        limit,
        status,
        agentUserId
      );
      return response.data;
    },
    enabled: true,
  });
};

/**
 * Admin hook to process withdrawal
 */
export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      withdrawalRequestId,
      payload,
    }: {
      withdrawalRequestId: string;
      payload: AdminWithdrawalProcessPayload;
    }) =>
      adminWithdrawalService.processWithdrawal(withdrawalRequestId, payload),
    onSuccess: () => {
      // Invalidate all admin withdrawal queries
      queryClient.invalidateQueries({
        queryKey: withdrawalKeys.adminBankRequests(),
      });
      // Also invalidate agent stats and commissions if needed
      queryClient.invalidateQueries({
        queryKey: ["agent", "commissions"],
      });
    },
  });
};

/**
 * Hook to get count of active withdrawal requests (pending + processing)
 */
export const useActiveWithdrawalCount = () => {
  const { data } = useBankWithdrawals(1, 1000);

  const activeCount = (data?.requests || []).filter(
    (req) => req.status === "pending" || req.status === "processing"
  ).length;

  return activeCount;
};
