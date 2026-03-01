/**
 * Admin Transaction Hooks
 * React Query hooks for transaction management
 */

"use client";

import { adminTransactionService } from "@/services/admin/transaction.service";
import { AdminTransactionQueryParams } from "@/types/admin/transaction.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

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
    queryFn: async () => {
      const response = await adminTransactionService.getTransactions(params);
      const search = params?.search?.trim();

      if (process.env.NODE_ENV !== "production" && search) {
        const pagination = response.data?.pagination;
        const rows = response.data?.transactions || [];
        console.info("[admin.transactions.search]", {
          search,
          page: pagination?.page ?? params?.page ?? 1,
          limit: pagination?.limit ?? params?.limit ?? 10,
          total: pagination?.total ?? 0,
          returned: rows.length,
        });
      }

      return response;
    },
    placeholderData: keepPreviousData,
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
