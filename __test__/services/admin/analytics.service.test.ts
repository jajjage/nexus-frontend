import apiClient from "@/lib/api-client";
import { adminAnalyticsService } from "@/services/admin/analytics.service";

// Mock the API client
vi.mock("@/lib/api-client");
const mockApiClient = apiClient as any;

describe("adminAnalyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getKeyMetrics", () => {
    it("should fetch key business metrics", async () => {
      const mockData = {
        arpu: 1250.5,
        ltv: 5400.0,
        churnRate: "2.5%",
        payingUsers: 1250,
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getKeyMetrics();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/key-metrics"
      );
      expect(result.data).toEqual(mockData);
    });
  });

  describe("getUserOverview", () => {
    it("should fetch user overview stats", async () => {
      const mockData = {
        totalUsers: 5000,
        newUsersThisMonth: 150,
        newUsersThisWeek: 45,
        activeUsersThisWeek: 3200,
        suspendedUsers: 12,
        trends: {
          userGrowthRate: "5.2%",
          weekOverWeek: "+45 users",
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getUserOverview();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/users/overview"
      );
      expect(result.data?.totalUsers).toBe(5000);
    });
  });

  describe("getTransactionOverview", () => {
    it("should fetch transaction overview without params", async () => {
      const mockData = {
        totalTransactions: 10000,
        totalValue: 5000000.0,
        successRate: "98.5%",
        averageAmount: 500.0,
        breakdownByStatus: {
          successful: 9850,
          failed: 100,
          pending: 50,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getTransactionOverview();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/transactions/overview",
        { params: undefined }
      );
      expect(result.data?.successRate).toBe("98.5%");
    });

    it("should fetch transaction overview with date params", async () => {
      const params = { fromDate: "2025-01-01", toDate: "2025-01-31" };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: {} },
      });

      await adminAnalyticsService.getTransactionOverview(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/transactions/overview",
        { params }
      );
    });
  });

  describe("getTopupOverview", () => {
    it("should fetch topup overview", async () => {
      const mockData = {
        totalTopups: 8000,
        totalValue: 400000.0,
        successRate: "99.0%",
        averageAmount: 50.0,
        byOperator: {
          MTN: 4000,
          Airtel: 2500,
          Glo: 1500,
        },
        topOperator: "MTN (50.0%)",
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getTopupOverview();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/topup/overview",
        { params: undefined }
      );
      expect(result.data?.byOperator.MTN).toBe(4000);
    });
  });

  describe("getWalletOverview", () => {
    it("should fetch wallet overview", async () => {
      const mockData = {
        totalBalance: 10000000.0,
        totalDeposits: 5000000.0,
        totalWithdrawals: 2000000.0,
        netMovement: 3000000.0,
        topHolders: [
          { userId: "uuid-1", email: "user@example.com", balance: 500000.0 },
        ],
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getWalletOverview();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/wallet/overview"
      );
      expect(result.data?.topHolders).toHaveLength(1);
    });
  });

  describe("getTransactionsByType", () => {
    it("should fetch transactions by type for charting", async () => {
      const mockData = {
        labels: ["Topup Request", "Bill Payment", "Transfer"],
        datasets: [
          {
            label: "Transaction Count",
            data: [500, 200, 100],
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          },
        ],
        summary: [
          {
            type: "topup_request",
            count: 500,
            totalAmount: 25000,
            percentage: 62,
          },
        ],
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getTransactionsByType();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/transactions/by-type",
        { params: undefined }
      );
      expect(result.data?.labels).toHaveLength(3);
    });
  });

  // ============================================================================
  // NEW ANALYTICS ENDPOINTS TESTS
  // ============================================================================

  describe("getTodaySnapshot", () => {
    it("should fetch today's snapshot", async () => {
      const mockData = {
        transactions: {
          count: 150,
          volume: 45000.5,
          profit: 2200.25,
          successful: 145,
          failed: 3,
          pending: 2,
        },
        newUsers: 12,
        activeUsers: 85,
        walletDeposits: 65000.0,
        walletWithdrawals: 12000.0,
        revenueEstimate: 2200.25,
        comparedToYesterday: {
          transactionsDelta: 15,
          transactionsDeltaPercent: "+11.1%",
          volumeDelta: 5000.5,
          volumeDeltaPercent: "+12.5%",
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getTodaySnapshot();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/analytics/today");
      expect(result.data?.transactions.count).toBe(150);
      expect(result.data?.comparedToYesterday.transactionsDeltaPercent).toBe(
        "+11.1%"
      );
    });
  });

  describe("getDailyMetrics", () => {
    it("should fetch daily metrics with params", async () => {
      const mockData = [
        {
          date: "2026-01-01",
          transactions: {
            count: 100,
            volume: 25000,
            successCount: 98,
            failedCount: 1,
            reversedCount: 1,
          },
          users: { newRegistrations: 5, activeUsers: 45 },
          wallet: { deposits: 30000, withdrawals: 5000, netFlow: 25000 },
          topups: { count: 100, volume: 25000 },
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const params = {
        fromDate: "2026-01-01",
        toDate: "2026-01-07",
        granularity: "day" as const,
      };
      const result = await adminAnalyticsService.getDailyMetrics(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/daily-metrics",
        { params }
      );
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].transactions.count).toBe(100);
    });
  });

  describe("getRevenueMetrics", () => {
    it("should fetch revenue metrics", async () => {
      const mockData = {
        period: { from: "2026-01-01", to: "2026-01-12" },
        gmv: 1000000.0,
        revenue: 50000.0,
        profit: 35000.0,
        profitMargin: "3.5%",
        costBreakdown: {
          supplierCosts: 950000.0,
          paymentFees: 15000.0,
          otherCosts: 0,
        },
        revenueByProduct: [
          {
            productType: "data",
            operator: "MTN",
            gmv: 400000,
            revenue: 20000,
            margin: "5.0%",
          },
        ],
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getRevenueMetrics();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/revenue",
        { params: undefined }
      );
      expect(result.data?.profitMargin).toBe("3.5%");
      expect(result.data?.revenueByProduct).toHaveLength(1);
    });
  });

  describe("getOperatorPerformance", () => {
    it("should fetch operator performance metrics", async () => {
      const mockData = {
        operators: [
          {
            name: "MTN",
            supplierSlug: "smeplug",
            transactions: {
              total: 500,
              successful: 480,
              failed: 20,
              successRate: "96.0%",
            },
            volume: { total: 150000, successful: 144000 },
            avgResponseTime: 0,
            trend: { volumeChange: "0%", successRateChange: "0%" },
          },
        ],
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getOperatorPerformance();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/operators/performance",
        { params: undefined }
      );
      expect(result.data?.operators).toHaveLength(1);
      expect(result.data?.operators[0].transactions.successRate).toBe("96.0%");
    });
  });

  describe("getUserSegments", () => {
    it("should fetch user segments", async () => {
      const mockData = {
        byActivity: {
          superActive: 15,
          active: 45,
          occasional: 120,
          dormant: 300,
          churned: 500,
        },
        bySpend: { highValue: 10, medium: 80, low: 400 },
        byRegistration: {
          last7Days: 25,
          last30Days: 110,
          last90Days: 450,
          older: 1200,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await adminAnalyticsService.getUserSegments();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/analytics/users/segments"
      );
      expect(result.data?.byActivity.superActive).toBe(15);
      expect(result.data?.bySpend.highValue).toBe(10);
    });
  });
});
