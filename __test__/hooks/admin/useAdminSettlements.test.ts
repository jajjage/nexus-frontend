import {
  useAdminSettlement,
  useAdminSettlements,
  useCreateSettlement,
} from "@/hooks/admin/useAdminSettlements";
import { adminSettlementService } from "@/services/admin/settlement.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/settlement.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminSettlementService = adminSettlementService as Mocked<
  typeof adminSettlementService
>;

describe("Admin Settlement Hooks", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminSettlements", () => {
    const mockSettlementsResponse = {
      success: true,
      message: "Settlements fetched",
      data: {
        settlements: [
          {
            id: "set-1",
            providerId: "provider-1",
            providerName: "Provider A",
            settlementDate: "2024-01-15",
            amount: 100000,
            fees: 1500,
            netAmount: 98500,
            reference: "SET-001",
            createdAt: "2024-01-15T10:00:00Z",
          },
          {
            id: "set-2",
            providerId: "provider-2",
            providerName: "Provider B",
            settlementDate: "2024-01-20",
            amount: 50000,
            fees: 750,
            netAmount: 49250,
            reference: "SET-002",
            createdAt: "2024-01-20T10:00:00Z",
          },
        ],
      },
    };

    it("should fetch settlements list successfully", async () => {
      mockAdminSettlementService.getSettlements.mockResolvedValue(
        mockSettlementsResponse
      );

      const { result } = renderHook(() => useAdminSettlements(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSettlementsResponse);
      expect(mockAdminSettlementService.getSettlements).toHaveBeenCalledWith(
        undefined
      );
    });

    it("should fetch settlements with date filters", async () => {
      mockAdminSettlementService.getSettlements.mockResolvedValue(
        mockSettlementsResponse
      );

      const { result } = renderHook(
        () =>
          useAdminSettlements({
            dateFrom: "2024-01-01",
            dateTo: "2024-01-31",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminSettlementService.getSettlements).toHaveBeenCalledWith({
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      });
    });

    it("should handle fetch error", async () => {
      mockAdminSettlementService.getSettlements.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAdminSettlements(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminSettlement", () => {
    const mockSettlementResponse = {
      success: true,
      message: "Settlement fetched",
      data: {
        settlement: {
          id: "set-123",
          providerId: "provider-1",
          settlementDate: "2024-01-15",
          amount: 100000,
          fees: 1500,
          netAmount: 98500,
          reference: "SET-001",
          rawReport: { transactionCount: 50 },
        },
      },
    };

    it("should fetch single settlement by ID", async () => {
      mockAdminSettlementService.getSettlementById.mockResolvedValue(
        mockSettlementResponse
      );

      const { result } = renderHook(() => useAdminSettlement("set-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSettlementResponse);
      expect(mockAdminSettlementService.getSettlementById).toHaveBeenCalledWith(
        "set-123"
      );
    });

    it("should not fetch when settlementId is empty", async () => {
      const { result } = renderHook(() => useAdminSettlement(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(
        mockAdminSettlementService.getSettlementById
      ).not.toHaveBeenCalled();
    });
  });

  describe("useCreateSettlement", () => {
    it("should create settlement successfully", async () => {
      const createData = {
        providerId: "provider-1",
        settlementDate: "2024-01-25",
        amount: 75000,
        fees: 1125,
        reference: "SET-003",
      };

      mockAdminSettlementService.createSettlement.mockResolvedValue({
        success: true,
        message: "Settlement created successfully",
        data: {
          settlement: {
            id: "set-new",
            ...createData,
            netAmount: 73875,
          },
        },
      });

      const { result } = renderHook(() => useCreateSettlement(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminSettlementService.createSettlement).toHaveBeenCalledWith(
        createData
      );
    });
  });
});
