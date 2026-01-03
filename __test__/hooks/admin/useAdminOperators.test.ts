import {
  useAdminOperator,
  useAdminOperators,
  useCreateOperator,
  useUpdateOperator,
} from "@/hooks/admin/useAdminOperators";
import { adminOperatorService } from "@/services/admin/operator.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/operator.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminOperatorService = adminOperatorService as Mocked<
  typeof adminOperatorService
>;

describe("Admin Operator Hooks", () => {
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

  describe("useAdminOperators", () => {
    const mockOperatorsResponse = {
      success: true,
      message: "Operators fetched",
      data: {
        operators: [
          {
            id: "op-1",
            code: "MTN",
            name: "MTN Nigeria",
            isoCountry: "NG",
            isActive: true,
          },
          {
            id: "op-2",
            code: "AIRTEL",
            name: "Airtel Nigeria",
            isoCountry: "NG",
            isActive: true,
          },
          {
            id: "op-3",
            code: "GLO",
            name: "Globacom",
            isoCountry: "NG",
            isActive: false,
          },
        ],
      },
    };

    it("should fetch operators list successfully", async () => {
      mockAdminOperatorService.getOperators.mockResolvedValue(
        mockOperatorsResponse
      );

      const { result } = renderHook(() => useAdminOperators(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOperatorsResponse);
      expect(mockAdminOperatorService.getOperators).toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockAdminOperatorService.getOperators.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAdminOperators(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminOperator", () => {
    const mockOperatorResponse = {
      success: true,
      message: "Operator fetched",
      data: {
        operator: {
          id: "op-123",
          code: "9MOBILE",
          name: "9Mobile Nigeria",
          isoCountry: "NG",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
        },
      },
    };

    it("should fetch single operator by ID", async () => {
      mockAdminOperatorService.getOperatorById.mockResolvedValue(
        mockOperatorResponse
      );

      const { result } = renderHook(() => useAdminOperator("op-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOperatorResponse);
      expect(mockAdminOperatorService.getOperatorById).toHaveBeenCalledWith(
        "op-123"
      );
    });

    it("should not fetch when operatorId is empty", async () => {
      const { result } = renderHook(() => useAdminOperator(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAdminOperatorService.getOperatorById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateOperator", () => {
    it("should create operator successfully", async () => {
      const createData = {
        code: "SMILE",
        name: "Smile Communications",
        isoCountry: "NG",
      };

      mockAdminOperatorService.createOperator.mockResolvedValue({
        success: true,
        message: "Operator created successfully",
        data: {
          operator: {
            id: "op-new",
            ...createData,
            isActive: true,
          },
        },
      });

      const { result } = renderHook(() => useCreateOperator(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminOperatorService.createOperator).toHaveBeenCalledWith(
        createData
      );
    });
  });

  describe("useUpdateOperator", () => {
    it("should update operator successfully", async () => {
      const updateData = {
        operatorId: "op-123",
        data: {
          name: "MTN Nigeria Updated",
          isoCountry: "NG",
        },
      };

      mockAdminOperatorService.updateOperator.mockResolvedValue({
        success: true,
        message: "Operator updated successfully",
        data: {
          operator: {
            id: "op-123",
            code: "MTN",
            name: "MTN Nigeria Updated",
            isoCountry: "NG",
          },
        },
      });

      const { result } = renderHook(() => useUpdateOperator(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminOperatorService.updateOperator).toHaveBeenCalledWith(
        "op-123",
        updateData.data
      );
    });
  });
});
