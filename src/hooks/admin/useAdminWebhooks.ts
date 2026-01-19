/**
 * Admin Webhook Reconciliation Hooks
 * React Query hooks for webhook reconciliation management
 */

"use client";

import { adminWebhookService } from "@/services/admin/webhook.service";
import {
  MatchWebhookRequest,
  ReviewWebhookRequest,
  WebhookQueryParams,
  WebhookStatus,
} from "@/types/admin/webhook.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys for cache management
const webhookKeys = {
  all: ["admin", "webhooks"] as const,
  stats: () => [...webhookKeys.all, "stats"] as const,
  list: (params?: WebhookQueryParams) =>
    [...webhookKeys.all, "list", params] as const,
  unmatched: (params?: WebhookQueryParams) =>
    [...webhookKeys.all, "unmatched", params] as const,
  byStatus: (status: WebhookStatus, params?: WebhookQueryParams) =>
    [...webhookKeys.all, "by-status", status, params] as const,
  bySupplier: (name: string, params?: WebhookQueryParams) =>
    [...webhookKeys.all, "by-supplier", name, params] as const,
  detail: (id: string) => [...webhookKeys.all, "detail", id] as const,
};

/**
 * Fetch webhook reconciliation statistics
 */
export function useWebhookStats() {
  return useQuery({
    queryKey: webhookKeys.stats(),
    queryFn: () => adminWebhookService.getStats(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch unmatched webhooks
 */
export function useUnmatchedWebhooks(params?: WebhookQueryParams) {
  return useQuery({
    queryKey: webhookKeys.unmatched(params),
    queryFn: () => adminWebhookService.getUnmatched(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch webhooks by status
 */
export function useWebhooksByStatus(
  status: WebhookStatus,
  params?: WebhookQueryParams
) {
  return useQuery({
    queryKey: webhookKeys.byStatus(status, params),
    queryFn: () => adminWebhookService.getByStatus(status, params),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch webhooks by supplier
 */
export function useWebhooksBySupplier(
  supplierName: string,
  params?: WebhookQueryParams
) {
  return useQuery({
    queryKey: webhookKeys.bySupplier(supplierName, params),
    queryFn: () => adminWebhookService.getBySupplier(supplierName, params),
    enabled: !!supplierName,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch single webhook detail
 */
export function useWebhook(id: string) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => adminWebhookService.getById(id),
    enabled: !!id,
  });
}

/**
 * Match webhook to topup request
 */
export function useMatchWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MatchWebhookRequest }) =>
      adminWebhookService.matchToTopup(id, data),
    onSuccess: (response) => {
      toast.success(response.message || "Webhook matched successfully");
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
    onError: () => {
      toast.error("Failed to match webhook to topup");
    },
  });
}

/**
 * Mark webhook for review
 */
export function useReviewWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ReviewWebhookRequest }) =>
      adminWebhookService.markForReview(id, data),
    onSuccess: (response) => {
      toast.success(response.message || "Webhook marked for review");
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
    onError: () => {
      toast.error("Failed to mark webhook for review");
    },
  });
}
