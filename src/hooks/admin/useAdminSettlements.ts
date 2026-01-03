/**
 * Admin Settlement Management Hooks
 * React Query hooks for settlement CRUD operations
 */

"use client";

import { adminSettlementService } from "@/services/admin/settlement.service";
import {
  CreateSettlementRequest,
  SettlementQueryParams,
} from "@/types/admin/settlement.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const settlementKeys = {
  all: ["admin", "settlements"] as const,
  list: (params?: SettlementQueryParams) =>
    [...settlementKeys.all, "list", params] as const,
  detail: (id: string) => [...settlementKeys.all, "detail", id] as const,
};

/**
 * Fetch list of settlements with filters
 */
export function useAdminSettlements(params?: SettlementQueryParams) {
  return useQuery({
    queryKey: settlementKeys.list(params),
    queryFn: () => adminSettlementService.getSettlements(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single settlement details
 */
export function useAdminSettlement(settlementId: string) {
  return useQuery({
    queryKey: settlementKeys.detail(settlementId),
    queryFn: () => adminSettlementService.getSettlementById(settlementId),
    enabled: !!settlementId,
  });
}

/**
 * Create new settlement
 */
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSettlementRequest) =>
      adminSettlementService.createSettlement(data),
    onSuccess: (response) => {
      toast.success(response.message || "Settlement created successfully");
      queryClient.invalidateQueries({ queryKey: settlementKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to create settlement"
      );
    },
  });
}
