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
});
