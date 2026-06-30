/**
 * Admin Supplier Errors Hooks
 * React Query hooks for supplier error analytics dashboard
 */

"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminSupplierErrorsService } from "@/services/admin/supplierErrors.service";
import { SupplierErrorsQueryParams } from "@/types/admin/supplierErrors.types";

const supplierErrorKeys = {
  all: ["admin", "supplier-errors"] as const,
  list: (params?: SupplierErrorsQueryParams) =>
    [...supplierErrorKeys.all, "list", params] as const,
  stats: (params?: { fromDate?: string; toDate?: string }) =>
    [...supplierErrorKeys.all, "stats", params] as const,
};

/**
 * Hook to retrieve supplier error logs
 */
export function useAdminSupplierErrors(params?: SupplierErrorsQueryParams) {
  return useQuery({
    queryKey: supplierErrorKeys.list(params),
    queryFn: async () => {
      const response = await adminSupplierErrorsService.getLogs(params);
      if (!response.success) {
        throw new Error(
          response.message || "Failed to fetch supplier error logs"
        );
      }
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to retrieve supplier error statistics
 */
export function useAdminSupplierErrorStats(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: supplierErrorKeys.stats(params),
    queryFn: async () => {
      const response = await adminSupplierErrorsService.getStats(params);
      if (!response.success) {
        throw new Error(
          response.message || "Failed to fetch supplier error stats"
        );
      }
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
