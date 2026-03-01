/**
 * Admin Topup Request Hooks
 * React Query hooks for topup request management
 */

"use client";

import { adminTopupService } from "@/services/admin/topup.service";
import { AdminTopupQueryParams } from "@/types/admin/topup.types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys for cache management
const topupKeys = {
  all: ["admin", "topups"] as const,
  list: (params?: AdminTopupQueryParams) =>
    [...topupKeys.all, "list", params] as const,
  detail: (requestId: string) =>
    [...topupKeys.all, "detail", requestId] as const,
};

/**
 * Fetch paginated list of topup requests with filters
 */
export function useAdminTopups(params?: AdminTopupQueryParams) {
  return useQuery({
    queryKey: topupKeys.list(params),
    queryFn: async () => {
      const response = await adminTopupService.getTopupRequests(params);
      const search = params?.search?.trim();

      if (process.env.NODE_ENV !== "production" && search) {
        const pagination = response.data?.pagination;
        const rows = response.data?.requests || [];
        console.info("[admin.topups.search]", {
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
 * Fetch single topup request details
 */
export function useAdminTopup(requestId: string) {
  return useQuery({
    queryKey: topupKeys.detail(requestId),
    queryFn: () => adminTopupService.getTopupRequestById(requestId),
    enabled: !!requestId,
  });
}

/**
 * Retry a failed topup request
 */
export function useRetryTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      adminTopupService.retryTopupRequest(requestId),
    onSuccess: (response) => {
      toast.success(response.message || "Topup retry initiated");
      queryClient.invalidateQueries({ queryKey: topupKeys.all });
    },
    onError: () => {
      toast.error("Failed to retry topup request");
    },
  });
}
