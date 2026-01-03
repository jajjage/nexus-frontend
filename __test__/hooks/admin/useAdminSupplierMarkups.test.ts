import {
  useAdminSupplierMarkup,
  useAdminSupplierMarkups,
  useCreateSupplierMarkup,
  useDeleteSupplierMarkup,
} from "@/hooks/admin/useAdminSupplierMarkups";
import { adminSupplierMarkupService } from "@/services/admin/supplier-markup.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/supplier-markup.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockService = adminSupplierMarkupService as Mocked<
  typeof adminSupplierMarkupService
>;

describe("Admin Supplier Markup Hooks", () => {
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

  describe("useAdminSupplierMarkups", () => {
    const mockMarkupsResponse = {
      success: true,
      message: "Markups fetched",
      data: {
        markups: [
          {
            id: "markup-1",
            supplierId: "sup-1",
            operatorProductId: "prod-1",
            markupPercent: 5,
            validFrom: "2024-01-01",
            validUntil: "2024-12-31",
            isActive: true,
          },
          {
            id: "markup-2",
            supplierId: "sup-2",
            operatorProductId: "prod-2",
            markupPercent: 10,
            validFrom: "2024-01-01",
            validUntil: "2024-06-30",
            isActive: false,
          },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    };

    it("should fetch markups list successfully", async () => {
      mockService.getMarkups.mockResolvedValue(mockMarkupsResponse);

      const { result } = renderHook(() => useAdminSupplierMarkups(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMarkupsResponse);
      expect(mockService.getMarkups).toHaveBeenCalled();
    });

    it("should fetch markups with supplierId filter", async () => {
      mockService.getMarkups.mockResolvedValue(mockMarkupsResponse);

      const { result } = renderHook(
        () => useAdminSupplierMarkups({ supplierId: "sup-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.getMarkups).toHaveBeenCalledWith({
        supplierId: "sup-1",
      });
    });
  });

  describe("useAdminSupplierMarkup", () => {
    const mockMarkupResponse = {
      success: true,
      message: "Markup fetched",
      data: {
        id: "markup-123",
        supplierId: "sup-1",
        operatorProductId: "prod-1",
        markupPercent: 5,
        validFrom: "2024-01-01",
        validUntil: "2024-12-31",
      },
    };

    it("should fetch single markup by ID", async () => {
      mockService.getMarkupById.mockResolvedValue(mockMarkupResponse);

      const { result } = renderHook(
        () => useAdminSupplierMarkup("markup-123"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.getMarkupById).toHaveBeenCalledWith("markup-123");
    });

    it("should not fetch when markupId is empty", async () => {
      const { result } = renderHook(() => useAdminSupplierMarkup(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockService.getMarkupById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateSupplierMarkup", () => {
    it("should create markup successfully", async () => {
      const createData = {
        supplierId: "sup-1",
        operatorProductId: "prod-1",
        markupPercent: 10,
        validFrom: "2024-01-01",
        validUntil: "2024-12-31",
      };

      mockService.createMarkup.mockResolvedValue({
        success: true,
        message: "Markup created",
        data: { markup: { id: "markup-new", ...createData } },
      });

      const { result } = renderHook(() => useCreateSupplierMarkup(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createMarkup).toHaveBeenCalledWith(createData);
    });
  });

  describe("useDeleteSupplierMarkup", () => {
    it("should delete markup successfully", async () => {
      mockService.deleteMarkup.mockResolvedValue({
        success: true,
        message: "Markup deleted",
      });

      const { result } = renderHook(() => useDeleteSupplierMarkup(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate("markup-123");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.deleteMarkup).toHaveBeenCalledWith("markup-123");
    });
  });
});
