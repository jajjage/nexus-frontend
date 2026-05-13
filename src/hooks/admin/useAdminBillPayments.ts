"use client";

import { adminBillPaymentService } from "@/services/admin/bill-payment.service";
import {
  AdminBillPaymentsQueryParams,
  SupplierBillerMappingPayload,
} from "@/types/admin/bill-payment.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const adminBillPaymentKeys = {
  all: ["admin", "bill-payments"] as const,
  payments: (params?: AdminBillPaymentsQueryParams) =>
    [...adminBillPaymentKeys.all, "payments", params] as const,
  payment: (id: string) =>
    [...adminBillPaymentKeys.all, "payment", id] as const,
  categories: () => [...adminBillPaymentKeys.all, "categories"] as const,
  billers: (category?: string) =>
    [...adminBillPaymentKeys.all, "billers", category || "all"] as const,
  variations: (billerIdOrCode?: string) =>
    [
      ...adminBillPaymentKeys.all,
      "variations",
      billerIdOrCode || "none",
    ] as const,
  mappings: (params?: unknown) =>
    [...adminBillPaymentKeys.all, "supplier-mappings", params] as const,
};

export function useAdminBillPayments(params?: AdminBillPaymentsQueryParams) {
  return useQuery({
    queryKey: adminBillPaymentKeys.payments(params),
    queryFn: () => adminBillPaymentService.getPayments(params),
    staleTime: 60 * 1000,
  });
}

export function useAdminBillPayment(paymentId: string) {
  return useQuery({
    queryKey: adminBillPaymentKeys.payment(paymentId),
    queryFn: () => adminBillPaymentService.getPayment(paymentId),
    enabled: !!paymentId,
  });
}

export function useAdminBillCategories() {
  return useQuery({
    queryKey: adminBillPaymentKeys.categories(),
    queryFn: () => adminBillPaymentService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAdminBillers(category?: string) {
  return useQuery({
    queryKey: adminBillPaymentKeys.billers(category),
    queryFn: () => adminBillPaymentService.getBillers(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminBillVariations(billerIdOrCode?: string) {
  return useQuery({
    queryKey: adminBillPaymentKeys.variations(billerIdOrCode),
    queryFn: () => adminBillPaymentService.getVariations(billerIdOrCode || ""),
    enabled: !!billerIdOrCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSupplierBillerMappings(params?: {
  supplierId?: string;
  billerId?: string;
  categoryType?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: adminBillPaymentKeys.mappings(params),
    queryFn: () => adminBillPaymentService.getSupplierMappings(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSupplierBillerMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplierBillerMappingPayload) =>
      adminBillPaymentService.createSupplierMapping(data),
    onSuccess: (response) => {
      toast.success(response.message || "Supplier mapping created");
      queryClient.invalidateQueries({ queryKey: adminBillPaymentKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to create supplier mapping"
      );
    },
  });
}

export function useUpdateSupplierBillerMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mappingId,
      data,
    }: {
      mappingId: string;
      data: Partial<SupplierBillerMappingPayload>;
    }) => adminBillPaymentService.updateSupplierMapping(mappingId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Supplier mapping updated");
      queryClient.invalidateQueries({ queryKey: adminBillPaymentKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to update supplier mapping"
      );
    },
  });
}
