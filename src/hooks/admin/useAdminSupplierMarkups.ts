/**
 * Admin Supplier Markup Management Hooks
 * React Query hooks for supplier markup CRUD operations
 */

"use client";

import { adminSupplierMarkupService } from "@/services/admin/supplier-markup.service";
import {
  CreateSupplierMarkupRequest,
  SupplierMarkupQueryParams,
  UpdateSupplierMarkupRequest,
} from "@/types/admin/supplier-markup.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const supplierMarkupKeys = {
  all: ["admin", "supplier-markups"] as const,
  list: (params?: SupplierMarkupQueryParams) =>
    [...supplierMarkupKeys.all, "list", params] as const,
  detail: (id: string) => [...supplierMarkupKeys.all, "detail", id] as const,
};

/**
 * Fetch supplier markups with optional filtering
 */
export function useAdminSupplierMarkups(params?: SupplierMarkupQueryParams) {
  return useQuery({
    queryKey: supplierMarkupKeys.list(params),
    queryFn: () => adminSupplierMarkupService.getMarkups(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single supplier markup details
 */
export function useAdminSupplierMarkup(markupId: string) {
  return useQuery({
    queryKey: supplierMarkupKeys.detail(markupId),
    queryFn: () => adminSupplierMarkupService.getMarkupById(markupId),
    enabled: !!markupId,
  });
}

/**
 * Create new supplier markup
 */
export function useCreateSupplierMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierMarkupRequest) =>
      adminSupplierMarkupService.createMarkup(data),
    onSuccess: (response) => {
      toast.success(response.message || "Markup created successfully");
      queryClient.invalidateQueries({ queryKey: supplierMarkupKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create markup");
    },
  });
}

/**
 * Update supplier markup
 */
export function useUpdateSupplierMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      markupId,
      data,
    }: {
      markupId: string;
      data: UpdateSupplierMarkupRequest;
    }) => adminSupplierMarkupService.updateMarkup(markupId, data),
    onSuccess: (response, { markupId }) => {
      toast.success(response.message || "Markup updated successfully");
      queryClient.invalidateQueries({
        queryKey: supplierMarkupKeys.detail(markupId),
      });
      queryClient.invalidateQueries({ queryKey: supplierMarkupKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update markup");
    },
  });
}

/**
 * Delete supplier markup
 */
export function useDeleteSupplierMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (markupId: string) =>
      adminSupplierMarkupService.deleteMarkup(markupId),
    onSuccess: (response) => {
      toast.success(response.message || "Markup deleted successfully");
      queryClient.invalidateQueries({ queryKey: supplierMarkupKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to delete markup");
    },
  });
}

/**
 * Activate supplier markup
 */
export function useActivateSupplierMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (markupId: string) =>
      adminSupplierMarkupService.activateMarkup(markupId),
    onSuccess: (response, markupId) => {
      toast.success(response.message || "Markup activated");
      queryClient.invalidateQueries({
        queryKey: supplierMarkupKeys.detail(markupId),
      });
      queryClient.invalidateQueries({ queryKey: supplierMarkupKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to activate markup");
    },
  });
}

/**
 * Deactivate supplier markup
 */
export function useDeactivateSupplierMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (markupId: string) =>
      adminSupplierMarkupService.deactivateMarkup(markupId),
    onSuccess: (response, markupId) => {
      toast.success(response.message || "Markup deactivated");
      queryClient.invalidateQueries({
        queryKey: supplierMarkupKeys.detail(markupId),
      });
      queryClient.invalidateQueries({ queryKey: supplierMarkupKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to deactivate markup"
      );
    },
  });
}
