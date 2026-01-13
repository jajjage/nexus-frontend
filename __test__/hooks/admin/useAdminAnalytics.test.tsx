import {
  transformOperatorDataForChart,
  useDailyMetrics,
  useKeyMetrics,
  useOperatorPerformance,
  useRevenueMetrics,
  useTodaySnapshot,
  useTopupOverview,
  useTransactionOverview,
  useTransactionsByType,
  useUserOverview,
  useUserSegments,
  useWalletOverview,
} from "@/hooks/admin/useAdminAnalytics";
import { adminAnalyticsService } from "@/services/admin/analytics.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { vi } from "vitest";

vi.mock("@/services/admin/analytics.service");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAdminAnalytics Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useKeyMetrics", () => {
    it("should fetch and return key metrics", async () => {
      const mockData = {
        arpu: 1250.5,
        ltv: 5400.0,
        churnRate: "2.5%",
        payingUsers: 1250,
      };

      vi.mocked(adminAnalyticsService.getKeyMetrics).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useKeyMetrics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(adminAnalyticsService.getKeyMetrics).toHaveBeenCalled();
    });
  });

  describe("useUserOverview", () => {
    it("should fetch user overview stats", async () => {
      const mockData = {
        totalUsers: 5000,
        newUsersThisMonth: 150,
        newUsersThisWeek: 35,
        activeUsersThisWeek: 1200,
        suspendedUsers: 25,
        trends: { userGrowthRate: "5.2%", weekOverWeek: "+45 users" },
      };

      vi.mocked(adminAnalyticsService.getUserOverview).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useUserOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.totalUsers).toBe(5000);
    });
  });

  describe("useTransactionOverview", () => {
    it("should fetch transaction overview with params", async () => {
      const mockData = {
        totalTransactions: 10000,
        totalValue: 5000000,
        successRate: "98.5%",
        averageAmount: 500,
        breakdownByStatus: {
          successful: 9850,
          failed: 100,
          pending: 50,
        },
      };

      vi.mocked(adminAnalyticsService.getTransactionOverview).mockResolvedValue(
        {
          success: true,
          data: mockData,
          message: "",
        }
      );

      const params = { fromDate: "2025-01-01", toDate: "2025-01-31" };
      const { result } = renderHook(() => useTransactionOverview(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(adminAnalyticsService.getTransactionOverview).toHaveBeenCalledWith(
        params
      );
    });
  });

  describe("useTopupOverview", () => {
    it("should fetch topup overview", async () => {
      const mockData = {
        totalTopups: 8000,
        totalValue: 4000000,
        successRate: "97.5%",
        averageAmount: 500,
        byOperator: { MTN: 4000 },
        topOperator: "MTN",
      };

      vi.mocked(adminAnalyticsService.getTopupOverview).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useTopupOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.byOperator.MTN).toBe(4000);
    });
  });

  describe("useWalletOverview", () => {
    it("should fetch wallet overview", async () => {
      const mockData = {
        totalBalance: 10000000,
        totalDeposits: 15000000,
        totalWithdrawals: 5000000,
        netMovement: 10000000,
        topHolders: [{ userId: "1", email: "test@test.com", balance: 500000 }],
      };

      vi.mocked(adminAnalyticsService.getWalletOverview).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useWalletOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.topHolders).toHaveLength(1);
    });
  });

  describe("useTransactionsByType", () => {
    it("should fetch transactions by type", async () => {
      const mockData = {
        labels: ["Topup", "Transfer"],
        datasets: [{ label: "Transaction Count", data: [500, 200] }],
        summary: [],
      };

      vi.mocked(adminAnalyticsService.getTransactionsByType).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useTransactionsByType(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.labels).toHaveLength(2);
    });
  });

  describe("transformOperatorDataForChart", () => {
    it("should transform operator data for Recharts", () => {
      const byOperator = {
        MTN: 4000,
        Airtel: 2500,
        Glo: 1500,
      };

      const result = transformOperatorDataForChart(byOperator);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: "MTN",
        value: 4000,
        fill: expect.any(String),
      });
    });
  });

  // ============================================================================
  // NEW ANALYTICS HOOKS TESTS
  // ============================================================================

  describe("useTodaySnapshot", () => {
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

      vi.mocked(adminAnalyticsService.getTodaySnapshot).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useTodaySnapshot(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.transactions.count).toBe(150);
      expect(
        result.current.data?.comparedToYesterday.transactionsDeltaPercent
      ).toBe("+11.1%");
    });
  });

  describe("useDailyMetrics", () => {
    it("should fetch daily metrics with valid params", async () => {
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

      vi.mocked(adminAnalyticsService.getDailyMetrics).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const params = { fromDate: "2026-01-01", toDate: "2026-01-07" };
      const { result } = renderHook(() => useDailyMetrics(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(adminAnalyticsService.getDailyMetrics).toHaveBeenCalledWith(
        params
      );
    });

    it("should not fetch when params are missing", async () => {
      const params = { fromDate: "", toDate: "" };
      const { result } = renderHook(() => useDailyMetrics(params), {
        wrapper: createWrapper(),
      });

      // Should not be fetching because enabled is false
      expect(result.current.isFetching).toBe(false);
      expect(adminAnalyticsService.getDailyMetrics).not.toHaveBeenCalled();
    });
  });

  describe("useRevenueMetrics", () => {
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
        revenueByProduct: [],
      };

      vi.mocked(adminAnalyticsService.getRevenueMetrics).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useRevenueMetrics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.profitMargin).toBe("3.5%");
    });
  });

  describe("useOperatorPerformance", () => {
    it("should fetch operator performance", async () => {
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

      vi.mocked(adminAnalyticsService.getOperatorPerformance).mockResolvedValue(
        {
          success: true,
          data: mockData,
          message: "",
        }
      );

      const { result } = renderHook(() => useOperatorPerformance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.operators).toHaveLength(1);
      expect(result.current.data?.operators[0].name).toBe("MTN");
    });
  });

  describe("useUserSegments", () => {
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

      vi.mocked(adminAnalyticsService.getUserSegments).mockResolvedValue({
        success: true,
        data: mockData,
        message: "",
      });

      const { result } = renderHook(() => useUserSegments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.byActivity.superActive).toBe(15);
      expect(result.current.data?.bySpend.highValue).toBe(10);
    });
  });
});
