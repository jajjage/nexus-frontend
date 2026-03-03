/**
 * Reseller Service
 * API methods for reseller-specific features
 */

import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api.types";
import type {
  ApiKeysListData,
  ApiPurchaseStatusResponseData,
  BulkTopupRequest,
  BulkTopupResponseData,
  CreateApiPurchaseHeaders,
  CreateApiPurchaseRequest,
  CreateApiPurchaseResult,
  CreateApiKeyRequest,
  CreateApiKeyResponseData,
  PurchaseStatus,
  ResellerPurchaseAnalytics,
  ResellerPurchaseAnalyticsQueryParams,
  RotateWebhookSecretResponse,
  UpdateWebhookConfigRequest,
  WebhookConfig,
} from "@/types/reseller.types";

const normalizePurchaseStatus = (raw: any): PurchaseStatus => ({
  requestId: raw?.requestId ?? raw?.request_id ?? "",
  topupRequestId: raw?.topupRequestId ?? raw?.topup_request_id ?? null,
  status: raw?.status ?? "pending",
  isFinal: Boolean(raw?.isFinal ?? raw?.is_final ?? false),
  idempotencyKey: raw?.idempotencyKey ?? raw?.idempotency_key ?? "",
  clientReference: raw?.clientReference ?? raw?.client_reference ?? null,
  callbackConfigured: Boolean(
    raw?.callbackConfigured ?? raw?.callback_configured ?? false
  ),
  callbackUrl: raw?.callbackUrl ?? raw?.callback_url ?? null,
  amount: Number(raw?.amount ?? 0),
  productCode: raw?.productCode ?? raw?.product_code ?? "",
  recipientPhone: raw?.recipientPhone ?? raw?.recipient_phone ?? "",
  createdAt: raw?.createdAt ?? raw?.created_at ?? new Date(0).toISOString(),
  updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date(0).toISOString(),
});

const normalizeWebhookConfig = (raw: any): WebhookConfig => ({
  callbackUrl: raw?.callbackUrl ?? raw?.callback_url ?? null,
  isActive: Boolean(raw?.isActive ?? raw?.is_active ?? false),
  callbackSecretConfigured: Boolean(
    raw?.callbackSecretConfigured ?? raw?.callback_secret_configured ?? false
  ),
  callbackSecretLastRotatedAt:
    raw?.callbackSecretLastRotatedAt ?? raw?.callback_secret_last_rotated_at,
  createdAt: raw?.createdAt ?? raw?.created_at,
  updatedAt: raw?.updatedAt ?? raw?.updated_at,
});

const normalizeAnalyticsStatusMap = (
  raw: any
): ResellerPurchaseAnalytics["breakdownByStatus"] => ({
  success: Number(raw?.success ?? 0),
  failed: Number(raw?.failed ?? 0),
  pending: Number(raw?.pending ?? 0),
  reversed: Number(raw?.reversed ?? 0),
});

const normalizePurchaseAnalytics = (raw: any): ResellerPurchaseAnalytics => ({
  period: {
    fromDate: raw?.period?.fromDate ?? raw?.period?.from_date ?? null,
    toDate: raw?.period?.toDate ?? raw?.period?.to_date ?? null,
  },
  scope: {
    userId: raw?.scope?.userId ?? raw?.scope?.user_id ?? null,
  },
  totals: {
    totalRequests: Number(
      raw?.totals?.totalRequests ?? raw?.totals?.total_requests ?? 0
    ),
    totalAmount: Number(
      raw?.totals?.totalAmount ?? raw?.totals?.total_amount ?? 0
    ),
  },
  breakdownByStatus: normalizeAnalyticsStatusMap(
    raw?.breakdownByStatus ?? raw?.breakdown_by_status
  ),
  amountByStatus: normalizeAnalyticsStatusMap(
    raw?.amountByStatus ?? raw?.amount_by_status
  ),
  derived: {
    successRate: String(
      raw?.derived?.successRate ?? raw?.derived?.success_rate ?? "0%"
    ),
  },
});

export const resellerService = {
  // ============= Bulk Topup =============

  /**
   * Process multiple topups in a single batch
   * @param data - Batch of topup requests (max 50 items)
   * @returns Batch processing results
   */
  bulkTopup: async (
    data: BulkTopupRequest
  ): Promise<ApiResponse<BulkTopupResponseData>> => {
    const response = await apiClient.post<ApiResponse<BulkTopupResponseData>>(
      "/reseller/bulk-topup",
      data
    );
    return response.data;
  },

  // ============= API Key Management =============

  /**
   * Get all API keys for the current reseller
   * @returns List of API keys (prefixes only, not full keys)
   */
  getApiKeys: async (): Promise<ApiResponse<ApiKeysListData>> => {
    const response =
      await apiClient.get<ApiResponse<ApiKeysListData>>("/reseller/keys");
    return response.data;
  },

  /**
   * Create a new API key
   * WARNING: The full key is returned ONLY ONCE in the response
   * @param data - Key name and environment (live/test)
   * @returns Created key with full key value
   */
  createApiKey: async (
    data: CreateApiKeyRequest
  ): Promise<ApiResponse<CreateApiKeyResponseData>> => {
    const response = await apiClient.post<
      ApiResponse<CreateApiKeyResponseData>
    >("/reseller/keys", data);
    return response.data;
  },

  /**
   * Revoke an API key permanently
   * @param keyId - ID of the key to revoke
   */
  revokeApiKey: async (keyId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/reseller/keys/${keyId}`
    );
    return response.data;
  },

  // ============= Webhook Config =============

  /**
   * Get reseller webhook callback configuration
   */
  getWebhookConfig: async (): Promise<ApiResponse<WebhookConfig>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      "/reseller/api/webhook-config"
    );

    const rawConfig = response.data?.data?.webhookConfig ?? response.data?.data;
    return {
      ...response.data,
      data: normalizeWebhookConfig(rawConfig),
    };
  },

  /**
   * Update reseller webhook callback URL and active state
   */
  updateWebhookConfig: async (
    data: UpdateWebhookConfigRequest
  ): Promise<ApiResponse<WebhookConfig>> => {
    const response = await apiClient.put<ApiResponse<any>>(
      "/reseller/api/webhook-config",
      data
    );

    const rawConfig = response.data?.data?.webhookConfig ?? response.data?.data;
    return {
      ...response.data,
      data: normalizeWebhookConfig(rawConfig),
    };
  },

  /**
   * Rotate reseller webhook callback secret
   */
  rotateWebhookSecret: async (): Promise<
    ApiResponse<RotateWebhookSecretResponse>
  > => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/reseller/api/webhook-config/rotate-secret"
    );
    const secretData = response.data?.data ?? {};

    return {
      ...response.data,
      data: {
        secret: secretData.secret ?? secretData.callbackSecret ?? "",
        rotatedAt: secretData.rotatedAt ?? secretData.rotated_at,
      },
    };
  },

  // ============= Reseller API Purchases =============

  /**
   * Create/test a purchase using reseller API credentials
   */
  createApiPurchase: async (
    data: CreateApiPurchaseRequest,
    headers: CreateApiPurchaseHeaders
  ): Promise<ApiResponse<CreateApiPurchaseResult>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/reseller/api/purchases",
      data,
      {
        headers: {
          "X-API-KEY": headers.apiKey,
          "X-Idempotency-Key": headers.idempotencyKey,
        },
      }
    );

    const rawPurchase = response.data?.data?.purchase ?? response.data?.data;
    const httpStatus = response.status === 202 ? 202 : 200;

    return {
      ...response.data,
      data: {
        httpStatus,
        purchase: normalizePurchaseStatus(rawPurchase),
      } as CreateApiPurchaseResult,
    };
  },

  /**
   * Get purchase status by request id
   */
  getApiPurchaseStatus: async (
    requestId: string
  ): Promise<ApiResponse<ApiPurchaseStatusResponseData>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/reseller/api/purchases/${requestId}`
    );

    const rawPurchase = response.data?.data?.purchase ?? response.data?.data;

    return {
      ...response.data,
      data: {
        purchase: normalizePurchaseStatus(rawPurchase),
      },
    };
  },

  /**
   * Get reseller purchase analytics overview for authenticated reseller scope
   */
  getPurchaseAnalyticsOverview: async (
    params?: ResellerPurchaseAnalyticsQueryParams
  ): Promise<ApiResponse<ResellerPurchaseAnalytics>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      "/reseller/api/purchases/analytics/overview",
      { params }
    );

    return {
      ...response.data,
      data: normalizePurchaseAnalytics(response.data?.data ?? {}),
    };
  },

  // ============= Upgrade Request =============

  /**
   * Request upgrade to reseller status
   * For regular users (role=user) to apply for reseller account
   * @param message - User's business pitch/reason for upgrade
   */
  requestUpgrade: async (
    message: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/reseller/request-upgrade",
      { message }
    );
    return response.data;
  },
};
