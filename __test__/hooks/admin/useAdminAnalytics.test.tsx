import {
  transformOperatorDataForChart,
  useKeyMetrics,
  useTopupOverview,
  useTransactionOverview,
  useTransactionsByType,
  useUserOverview,
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
});
