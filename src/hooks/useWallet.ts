import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
import { GetTransactionsParams } from "@/types/wallet.types";
import { AxiosError } from "axios";

// ============= Query Keys =============
export const walletKeys = {
  all: ["wallet"] as const,
  wallet: () => [...walletKeys.all, "details"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: {
    all: () => [...walletKeys.all, "transactions"] as const,
    list: (params?: GetTransactionsParams) =>
      [...walletKeys.transactions.all(), params] as const,
    detail: (id: string) => [...walletKeys.transactions.all(), id] as const,
  },
};

// ============= Wallet Queries =============

/**
 * Get user wallet details
 */
export const useWallet = () => {
  return useQuery({
    queryKey: walletKeys.wallet(),
    queryFn: () => walletService.getWallet(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/**
 * Get wallet balance
 */
export const useWalletBalance = () => {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    retry: 2,
  });
};

/**
 * Get all transactions with optional filters
 */
export const useTransactions = (params?: GetTransactionsParams) => {
  return useQuery({
    queryKey: walletKeys.transactions.list(params),
    queryFn: () => walletService.getTransactions(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
    // Only fetch if we have a wallet
    enabled: true,
  });
};

/**
 * Get single transaction by ID
 */
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: walletKeys.transactions.detail(id),
    queryFn: () => walletService.getTransactionById(id),
    staleTime: 1000 * 60 * 10, // 10 minutes (transaction details don't change often)
    retry: 2,
    enabled: !!id, // Only fetch if ID is provided
  });
};

/**
 * Get recent transactions (last 10)
 */
export const useRecentTransactions = () => {
  return useTransactions({ page: 1, limit: 10 });
};

/**
 * Get pending transactions
 */
export const usePendingTransactions = () => {
  return useTransactions({ status: "PENDING" as any, page: 1, limit: 20 });
};
