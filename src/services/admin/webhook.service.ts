/**
 * Admin Webhook Reconciliation Service
 * API methods for webhook reconciliation management
 */

import apiClient from "@/lib/api-client";
import {
  MatchWebhookRequest,
  ReviewWebhookRequest,
  WebhookListResponse,
  WebhookQueryParams,
  WebhookReconciliationRecord,
  WebhookStats,
} from "@/types/admin/webhook.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/webhooks/reconciliation";

export const adminWebhookService = {
  /**
   * Get webhook reconciliation statistics
   */
  getStats: async (): Promise<ApiResponse<WebhookStats>> => {
    const response = await apiClient.get<ApiResponse<WebhookStats>>(
      `${BASE_PATH}/stats`
    );
    return response.data;
  },

  /**
   * Get unmatched webhooks
   */
  getUnmatched: async (
    params?: WebhookQueryParams
  ): Promise<ApiResponse<WebhookListResponse>> => {
    const response = await apiClient.get<ApiResponse<WebhookListResponse>>(
      `${BASE_PATH}/unmatched`,
      { params }
    );
    return response.data;
  },

  /**
   * Get webhooks by status
   */
  getByStatus: async (
    status: string,
    params?: WebhookQueryParams
  ): Promise<ApiResponse<WebhookListResponse>> => {
    const response = await apiClient.get<ApiResponse<WebhookListResponse>>(
      `${BASE_PATH}/by-status/${status}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get webhooks by supplier
   */
  getBySupplier: async (
    supplierName: string,
    params?: WebhookQueryParams
  ): Promise<ApiResponse<WebhookListResponse>> => {
    const response = await apiClient.get<ApiResponse<WebhookListResponse>>(
      `${BASE_PATH}/supplier/${supplierName}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single webhook by ID
   */
  getById: async (
    id: string
  ): Promise<ApiResponse<WebhookReconciliationRecord>> => {
    const response = await apiClient.get<
      ApiResponse<WebhookReconciliationRecord>
    >(`${BASE_PATH}/${id}`);
    return response.data;
  },

  /**
   * Manually match a webhook to a topup request
   */
  matchToTopup: async (
    id: string,
    data: MatchWebhookRequest
  ): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${id}/match`,
      data
    );
    return response.data;
  },

  /**
   * Mark a webhook for manual review
   */
  markForReview: async (
    id: string,
    data?: ReviewWebhookRequest
  ): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${id}/review`,
      data
    );
    return response.data;
  },
};
