/**
 * Admin Operator Management Hooks
 * React Query hooks for operator CRUD operations
 */

"use client";

import { adminOperatorService } from "@/services/admin/operator.service";
import {
  CreateOperatorRequest,
  UpdateOperatorRequest,
} from "@/types/admin/operator.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const operatorKeys = {
  all: ["admin", "operators"] as const,
  list: () => [...operatorKeys.all, "list"] as const,
  detail: (id: string) => [...operatorKeys.all, "detail", id] as const,
};

/**
 * Fetch all operators
 */
export function useAdminOperators() {
  return useQuery({
    queryKey: operatorKeys.list(),
    queryFn: () => adminOperatorService.getOperators(),
    staleTime: 5 * 60 * 1000, // 5 minutes - operators rarely change
  });
}

/**
 * Fetch single operator details
 */
export function useAdminOperator(operatorId: string) {
  return useQuery({
    queryKey: operatorKeys.detail(operatorId),
    queryFn: () => adminOperatorService.getOperatorById(operatorId),
    enabled: !!operatorId,
  });
}

/**
 * Create new operator
 */
export function useCreateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOperatorRequest) =>
      adminOperatorService.createOperator(data),
    onSuccess: (response) => {
      toast.success(response.message || "Operator created successfully");
      queryClient.invalidateQueries({ queryKey: operatorKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create operator");
    },
  });
}

/**
 * Update operator
 */
export function useUpdateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      operatorId,
      data,
    }: {
      operatorId: string;
      data: UpdateOperatorRequest;
    }) => adminOperatorService.updateOperator(operatorId, data),
    onSuccess: (response, { operatorId }) => {
      toast.success(response.message || "Operator updated successfully");
      queryClient.invalidateQueries({
        queryKey: operatorKeys.detail(operatorId),
      });
      queryClient.invalidateQueries({ queryKey: operatorKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update operator");
    },
  });
}
