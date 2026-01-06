/**
 * Admin Provider Management Hooks
 * React Query hooks for provider CRUD operations
 */

"use client";

import { adminProviderService } from "@/services/admin/provider.service";
import {
  CreateProviderRequest,
  UpdateProviderRequest,
} from "@/types/admin/provider.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const providerKeys = {
  all: ["admin", "providers"] as const,
  list: () => [...providerKeys.all, "list"] as const,
  detail: (id: string) => [...providerKeys.all, "detail", id] as const,
};

/**
 * Fetch all providers
 */
export function useAdminProviders() {
  return useQuery({
    queryKey: providerKeys.list(),
    queryFn: () => adminProviderService.getProviders(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single provider details
 */
export function useAdminProvider(providerId: string) {
  return useQuery({
    queryKey: providerKeys.detail(providerId),
    queryFn: () => adminProviderService.getProviderById(providerId),
    enabled: !!providerId,
  });
}

/**
 * Create new provider
 */
export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProviderRequest) =>
      adminProviderService.createProvider(data),
    onSuccess: (response) => {
      toast.success(response.message || "Provider created successfully");
      queryClient.invalidateQueries({ queryKey: providerKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create provider");
    },
  });
}

/**
 * Update provider
 */
export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      providerId,
      data,
    }: {
      providerId: string;
      data: UpdateProviderRequest;
    }) => adminProviderService.updateProvider(providerId, data),
    onSuccess: (response, { providerId }) => {
      toast.success(response.message || "Provider updated successfully");
      queryClient.invalidateQueries({
        queryKey: providerKeys.detail(providerId),
      });
      queryClient.invalidateQueries({ queryKey: providerKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update provider");
    },
  });
}

/**
 * Delete provider
 */
export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) =>
      adminProviderService.deleteProvider(providerId),
    onSuccess: (response) => {
      toast.success(response.message || "Provider deleted successfully");
      queryClient.invalidateQueries({ queryKey: providerKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to delete provider");
    },
  });
}
