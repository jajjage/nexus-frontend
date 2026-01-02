/**
 * Admin Transaction Hooks
 * React Query hooks for transaction management
 */

"use client";

import { adminTransactionService } from "@/services/admin/transaction.service";
import { AdminTransactionQueryParams } from "@/types/admin/transaction.types";
import { useQuery } from "@tanstack/react-query";

// Query keys for cache management
const transactionKeys = {
  all: ["admin", "transactions"] as const,
  list: (params?: AdminTransactionQueryParams) =>
    [...transactionKeys.all, "list", params] as const,
  detail: (transactionId: string) =>
    [...transactionKeys.all, "detail", transactionId] as const,
};

/**
 * Fetch paginated list of transactions with filters
 */
export function useAdminTransactions(params?: AdminTransactionQueryParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => adminTransactionService.getTransactions(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch single transaction details
 */
export function useAdminTransaction(transactionId: string) {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId),
    queryFn: () => adminTransactionService.getTransactionById(transactionId),
    enabled: !!transactionId,
  });
}
