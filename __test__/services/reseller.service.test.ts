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
});
