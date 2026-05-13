"use client";

import { billPaymentService } from "@/services/bill-payment.service";
import {
  BillCategoryType,
  BillPayment,
  BillPaymentRequest,
  BillValidationRequest,
} from "@/types/bill-payment.types";
import { ApiResponse, User } from "@/types/api.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const billPaymentKeys = {
  all: ["bill-payments"] as const,
  categories: () => [...billPaymentKeys.all, "categories"] as const,
  billers: (category?: string) =>
    [...billPaymentKeys.all, "billers", category || "all"] as const,
  variations: (billerCode?: string) =>
    [...billPaymentKeys.all, "variations", billerCode || "none"] as const,
  payment: (paymentId?: string) =>
    [...billPaymentKeys.all, "payment", paymentId || "none"] as const,
};

export function useBillCategories() {
  return useQuery({
    queryKey: billPaymentKeys.categories(),
    queryFn: () => billPaymentService.getCategories(),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data || [],
  });
}

export function useBillers(category: BillCategoryType) {
  return useQuery({
    queryKey: billPaymentKeys.billers(category),
    queryFn: () => billPaymentService.getBillers(category),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data || [],
  });
}

export function useBillVariations(billerCode?: string) {
  return useQuery({
    queryKey: billPaymentKeys.variations(billerCode),
    queryFn: () => billPaymentService.getVariations(billerCode || ""),
    enabled: Boolean(billerCode),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data || [],
  });
}

export function useValidateBillCustomer() {
  return useMutation({
    mutationFn: (data: BillValidationRequest) =>
      billPaymentService.validateCustomer(data),
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Unable to validate customer details"
      );
    },
  });
}

interface BillPaymentContext {
  previousUser: User | undefined;
}

export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<BillPayment>,
    AxiosError<any>,
    BillPaymentRequest,
    BillPaymentContext
  >({
    mutationFn: (data) => billPaymentService.payBill(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: authKeys.currentUser() });

      const previousUser = queryClient.getQueryData<User>(
        authKeys.currentUser()
      );

      queryClient.setQueryData(authKeys.currentUser(), (old: any) => {
        if (!old) return old;
        const currentBalance = parseFloat(old.balance || "0");
        const newBalance = Math.max(0, currentBalance - data.amount);
        return {
          ...old,
          balance: newBalance.toFixed(2),
        };
      });

      return { previousUser };
    },
    onSuccess: (response) => {
      toast.success("Payment submitted", {
        description:
          response.message || "Your bill payment is being processed.",
      });
    },
    onError: (error, _data, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(authKeys.currentUser(), context.previousUser);
      }

      const responseData = error.response?.data;
      const message =
        responseData?.message ||
        responseData?.data?.message ||
        responseData?.error ||
        error.message ||
        "Bill payment failed. Please try again.";

      toast.error("Payment failed", { description: message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useBillPayment(paymentId?: string) {
  return useQuery({
    queryKey: billPaymentKeys.payment(paymentId),
    queryFn: () => billPaymentService.getPayment(paymentId || ""),
    enabled: Boolean(paymentId),
    select: (response) => response.data,
  });
}
