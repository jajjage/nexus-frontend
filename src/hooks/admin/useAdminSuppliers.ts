/**
 * Admin Supplier Management Hooks
 * React Query hooks for supplier CRUD operations
 */

"use client";

import { adminSupplierService } from "@/services/admin/supplier.service";
import {
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/types/admin/supplier.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const supplierKeys = {
  all: ["admin", "suppliers"] as const,
  list: () => [...supplierKeys.all, "list"] as const,
  detail: (id: string) => [...supplierKeys.all, "detail", id] as const,
};

/**
 * Fetch all suppliers
 */
export function useAdminSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: () => adminSupplierService.getSuppliers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single supplier details
 */
export function useAdminSupplier(supplierId: string) {
  return useQuery({
    queryKey: supplierKeys.detail(supplierId),
    queryFn: () => adminSupplierService.getSupplierById(supplierId),
    enabled: !!supplierId,
  });
}

/**
 * Create new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierRequest) =>
      adminSupplierService.createSupplier(data),
    onSuccess: (response) => {
      toast.success(response.message || "Supplier created successfully");
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create supplier");
    },
  });
}

/**
 * Update supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      data,
    }: {
      supplierId: string;
      data: UpdateSupplierRequest;
    }) => adminSupplierService.updateSupplier(supplierId, data),
    onSuccess: (response, { supplierId }) => {
      toast.success(response.message || "Supplier updated successfully");
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(supplierId),
      });
      queryClient.invalidateQueries({ queryKey: supplierKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update supplier");
    },
  });
}
