import apiClient from "@/lib/api-client";
import { adminResellerApiService } from "@/services/admin/reseller-api.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("adminResellerApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches callbacks overview", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          total: 10,
          delivered: 6,
          failed: 2,
          pending: 2,
          success_rate: 0.6,
          avg_latency_ms: 320,
        },
      },
    } as any);

    const result = await adminResellerApiService.getCallbacksOverview();

    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/reseller-api/callbacks/overview"
    );
    expect(result.data).toEqual({
      total: 10,
      delivered: 6,
      failed: 2,
      pending: 2,
      successRate: 0.6,
      avgLatencyMs: 320,
    });
  });

  it("fetches deliveries with params and normalizes pagination", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          deliveries: [
            {
              id: "del_1",
              request_id: "req_1",
              callback_url: "https://example.com/cb",
              status: "delivered",
              attempt_count: 1,
              http_status: 200,
              created_at: "2026-03-03T00:00:00.000Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            total_pages: 1,
            has_next_page: false,
            has_prev_page: false,
          },
        },
      },
    } as any);

    const result = await adminResellerApiService.getCallbacksDeliveries({
      page: 1,
      limit: 20,
      search: "req_1",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/reseller-api/callbacks/deliveries",
      {
        params: {
          page: 1,
          limit: 20,
          search: "req_1",
        },
      }
    );
    expect(result.data?.deliveries[0].requestId).toBe("req_1");
    expect(result.data?.pagination.totalPages).toBe(1);
    expect(result.data?.pagination.hasNextPage).toBe(false);
  });

  it("fetches circuit breakers", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          breakers: [
            {
              supplier: "Supplier A",
              state: "open",
              failure_count: 4,
              success_count: 0,
              opened_at: "2026-03-03T00:00:00.000Z",
            },
          ],
        },
      },
    } as any);

    const result = await adminResellerApiService.getCircuitBreakers();

    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/reseller-api/circuit-breakers"
    );
    expect(result.data?.breakers[0]).toEqual({
      supplier: "Supplier A",
      state: "open",
      failureCount: 4,
      successCount: 0,
      openedAt: "2026-03-03T00:00:00.000Z",
      lastFailureAt: null,
      nextAttemptAt: null,
    });
  });

  it("fetches reseller purchase analytics overview with filters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          period: {
            fromDate: "2026-03-01",
            toDate: "2026-03-31",
          },
          scope: {
            userId: "reseller_42",
          },
          totals: {
            totalRequests: 250,
            totalAmount: 188000,
          },
          breakdownByStatus: {
            success: 200,
            failed: 20,
            pending: 25,
            reversed: 5,
          },
          amountByStatus: {
            success: 160000,
            failed: 15000,
            pending: 10000,
            reversed: 3000,
          },
          derived: {
            successRate: "80.0%",
          },
        },
      },
    } as any);

    const result = await adminResellerApiService.getPurchaseAnalyticsOverview({
      fromDate: "2026-03-01",
      toDate: "2026-03-31",
      userId: "reseller_42",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/analytics/reseller-api/purchases/overview",
      {
        params: {
          fromDate: "2026-03-01",
          toDate: "2026-03-31",
          userId: "reseller_42",
        },
      }
    );

    expect(result.data).toEqual({
      period: {
        fromDate: "2026-03-01",
        toDate: "2026-03-31",
      },
      scope: {
        userId: "reseller_42",
      },
      totals: {
        totalRequests: 250,
        totalAmount: 188000,
      },
      breakdownByStatus: {
        success: 200,
        failed: 20,
        pending: 25,
        reversed: 5,
      },
      amountByStatus: {
        success: 160000,
        failed: 15000,
        pending: 10000,
        reversed: 3000,
      },
      derived: {
        successRate: "80.0%",
      },
    });
  });
});
