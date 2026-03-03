/**
 * Reseller Service Tests
 */

import apiClient from "@/lib/api-client";
import { resellerService } from "@/services/reseller.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("resellerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bulkTopup", () => {
    it("should send bulk topup request with correct payload", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Batch processed",
          data: {
            batchId: "batch-123",
            successCount: 2,
            failedCount: 0,
            totalCost: 1500,
            results: [],
          },
        },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const request = {
        batchName: "Test Batch",
        pin: "1234",
        requests: [
          {
            recipientPhone: "08012345678",
            amount: 500,
            productCode: "MTN-AIRTIME",
          },
          {
            recipientPhone: "08087654321",
            amount: 1000,
            productCode: "GLO-DATA-1GB",
          },
        ],
      };

      const result = await resellerService.bulkTopup(request);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/reseller/bulk-topup",
        request
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getApiKeys", () => {
    it("should fetch API keys list", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            keys: [
              {
                id: "key-1",
                name: "Website Key",
                key_prefix: "nx_live_abc",
                is_active: true,
                last_used_at: null,
                created_at: "2024-01-01T00:00:00Z",
              },
            ],
          },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await resellerService.getApiKeys();

      expect(apiClient.get).toHaveBeenCalledWith("/reseller/keys");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("createApiKey", () => {
    it("should create API key and return full key", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: "key-new",
            key: "nx_live_fullsecretkey123",
          },
        },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const request = { name: "New Integration", isLive: true };
      const result = await resellerService.createApiKey(request);

      expect(apiClient.post).toHaveBeenCalledWith("/reseller/keys", request);
      expect(result.data?.key).toBe("nx_live_fullsecretkey123");
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke API key by ID", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "API Key revoked successfully",
        },
      };
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const keyId = "key-to-revoke";
      const result = await resellerService.revokeApiKey(keyId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/reseller/keys/${keyId}`);
      expect(result.success).toBe(true);
    });
  });

  describe("getWebhookConfig", () => {
    it("should fetch and normalize webhook config", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            callback_url: "https://example.com/callback",
            is_active: true,
            callback_secret_configured: true,
          },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse as any);

      const result = await resellerService.getWebhookConfig();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/reseller/api/webhook-config"
      );
      expect(result.data).toEqual({
        callbackUrl: "https://example.com/callback",
        isActive: true,
        callbackSecretConfigured: true,
        callbackSecretLastRotatedAt: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      });
    });
  });

  describe("updateWebhookConfig", () => {
    it("should update webhook config", async () => {
      const payload = {
        callbackUrl: "https://example.com/hook",
        isActive: true,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            callback_url: payload.callbackUrl,
            is_active: payload.isActive,
          },
        },
      };
      vi.mocked(apiClient.put as any).mockResolvedValue(mockResponse);

      const result = await resellerService.updateWebhookConfig(payload);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/reseller/api/webhook-config",
        payload
      );
      expect(result.data?.callbackUrl).toBe(payload.callbackUrl);
      expect(result.data?.isActive).toBe(true);
    });
  });

  describe("rotateWebhookSecret", () => {
    it("should rotate and return one-time secret", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            secret: "whsec_123",
            rotated_at: "2026-03-03T00:00:00.000Z",
          },
        },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as any);

      const result = await resellerService.rotateWebhookSecret();

      expect(apiClient.post).toHaveBeenCalledWith(
        "/reseller/api/webhook-config/rotate-secret"
      );
      expect(result.data?.secret).toBe("whsec_123");
      expect(result.data?.rotatedAt).toBe("2026-03-03T00:00:00.000Z");
    });
  });

  describe("createApiPurchase", () => {
    it("should send purchase with API key and idempotency headers", async () => {
      const mockResponse = {
        status: 202,
        data: {
          success: true,
          data: {
            purchase: {
              request_id: "req_1",
              topup_request_id: null,
              status: "pending",
              is_final: false,
              idempotency_key: "idem_1",
              client_reference: null,
              callback_configured: true,
              callback_url: "https://example.com/callback",
              amount: 1000,
              product_code: "MTN-DATA-1GB",
              recipient_phone: "08012345678",
              created_at: "2026-03-03T00:00:00.000Z",
              updated_at: "2026-03-03T00:00:00.000Z",
            },
          },
        },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse as any);

      const result = await resellerService.createApiPurchase(
        {
          productCode: "MTN-DATA-1GB",
          amount: 1000,
          recipientPhone: "08012345678",
        },
        {
          apiKey: "nx_live_abc",
          idempotencyKey: "idem_1",
        }
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        "/reseller/api/purchases",
        {
          productCode: "MTN-DATA-1GB",
          amount: 1000,
          recipientPhone: "08012345678",
        },
        {
          headers: {
            "X-API-KEY": "nx_live_abc",
            "X-Idempotency-Key": "idem_1",
          },
        }
      );

      expect(result.data?.httpStatus).toBe(202);
      expect(result.data?.purchase.requestId).toBe("req_1");
      expect(result.data?.purchase.isFinal).toBe(false);
    });
  });

  describe("getApiPurchaseStatus", () => {
    it("should fetch and normalize purchase status by request id", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            request_id: "req_123",
            topup_request_id: "topup_123",
            status: "completed",
            is_final: true,
            idempotency_key: "idem_123",
            client_reference: "client_1",
            callback_configured: true,
            callback_url: "https://example.com/callback",
            amount: 2000,
            product_code: "MTN-DATA-2GB",
            recipient_phone: "08011111111",
            created_at: "2026-03-03T00:00:00.000Z",
            updated_at: "2026-03-03T00:01:00.000Z",
          },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse as any);

      const result = await resellerService.getApiPurchaseStatus("req_123");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/reseller/api/purchases/req_123"
      );
      expect(result.data?.purchase.requestId).toBe("req_123");
      expect(result.data?.purchase.topupRequestId).toBe("topup_123");
      expect(result.data?.purchase.isFinal).toBe(true);
    });
  });

  describe("getPurchaseAnalyticsOverview", () => {
    it("should fetch reseller purchase analytics with date params", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "ok",
          data: {
            period: {
              from_date: "2026-03-01",
              to_date: "2026-03-31",
            },
            scope: {
              user_id: "reseller_123",
            },
            totals: {
              total_requests: 120,
              total_amount: 450000,
            },
            breakdown_by_status: {
              success: 90,
              failed: 10,
              pending: 15,
              reversed: 5,
            },
            amount_by_status: {
              success: 380000,
              failed: 25000,
              pending: 30000,
              reversed: 15000,
            },
            derived: {
              success_rate: "75.0%",
            },
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse as any);

      const result = await resellerService.getPurchaseAnalyticsOverview({
        fromDate: "2026-03-01",
        toDate: "2026-03-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/reseller/api/purchases/analytics/overview",
        {
          params: {
            fromDate: "2026-03-01",
            toDate: "2026-03-31",
          },
        }
      );

      expect(result.data).toEqual({
        period: {
          fromDate: "2026-03-01",
          toDate: "2026-03-31",
        },
        scope: {
          userId: "reseller_123",
        },
        totals: {
          totalRequests: 120,
          totalAmount: 450000,
        },
        breakdownByStatus: {
          success: 90,
          failed: 10,
          pending: 15,
          reversed: 5,
        },
        amountByStatus: {
          success: 380000,
          failed: 25000,
          pending: 30000,
          reversed: 15000,
        },
        derived: {
          successRate: "75.0%",
        },
      });
    });
  });
});
