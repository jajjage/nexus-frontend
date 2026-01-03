import {
  useAdminSupplier,
  useAdminSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/admin/useAdminSuppliers";
import { adminSupplierService } from "@/services/admin/supplier.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/supplier.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminSupplierService = adminSupplierService as Mocked<
  typeof adminSupplierService
>;

describe("Admin Supplier Hooks", () => {
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

  describe("useAdminSuppliers", () => {
    const mockSuppliersResponse = {
      success: true,
      message: "Suppliers fetched",
      data: {
        suppliers: [
          {
            id: "sup-1",
            name: "Supplier One",
            slug: "supplier-one",
            apiBase: "https://api.one.com",
            priorityInt: 1,
            isActive: true,
          },
          {
            id: "sup-2",
            name: "Supplier Two",
            slug: "supplier-two",
            apiBase: "https://api.two.com",
            priorityInt: 2,
            isActive: false,
          },
        ],
      },
    };

    it("should fetch suppliers list successfully", async () => {
      mockAdminSupplierService.getSuppliers.mockResolvedValue(
        mockSuppliersResponse
      );

      const { result } = renderHook(() => useAdminSuppliers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSuppliersResponse);
      expect(mockAdminSupplierService.getSuppliers).toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockAdminSupplierService.getSuppliers.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAdminSuppliers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminSupplier", () => {
    const mockSupplierResponse = {
      success: true,
      message: "Supplier fetched",
      data: {
        supplier: {
          id: "sup-123",
          name: "Test Supplier",
          slug: "test-supplier",
          apiBase: "https://api.test.com",
          apiKey: "sk_***",
          priorityInt: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      },
    };

    it("should fetch single supplier by ID", async () => {
      mockAdminSupplierService.getSupplierById.mockResolvedValue(
        mockSupplierResponse
      );

      const { result } = renderHook(() => useAdminSupplier("sup-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSupplierResponse);
      expect(mockAdminSupplierService.getSupplierById).toHaveBeenCalledWith(
        "sup-123"
      );
    });

    it("should not fetch when supplierId is empty", async () => {
      const { result } = renderHook(() => useAdminSupplier(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAdminSupplierService.getSupplierById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateSupplier", () => {
    it("should create supplier successfully", async () => {
      const createData = {
        name: "New Supplier",
        slug: "new-supplier",
        apiBase: "https://api.new.com",
        apiKey: "sk_live_123",
        priorityInt: 3,
        isActive: true,
      };

      mockAdminSupplierService.createSupplier.mockResolvedValue({
        success: true,
        message: "Supplier created successfully",
        data: {
          supplier: {
            id: "sup-new",
            ...createData,
          },
        },
      });

      const { result } = renderHook(() => useCreateSupplier(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminSupplierService.createSupplier).toHaveBeenCalledWith(
        createData
      );
    });
  });

  describe("useUpdateSupplier", () => {
    it("should update supplier successfully", async () => {
      const updateData = {
        supplierId: "sup-123",
        data: {
          name: "Updated Supplier",
          isActive: false,
        },
      };

      mockAdminSupplierService.updateSupplier.mockResolvedValue({
        success: true,
        message: "Supplier updated successfully",
        data: {
          supplier: {
            id: "sup-123",
            name: "Updated Supplier",
            slug: "test-supplier",
            apiBase: "https://api.test.com",
            priorityInt: 1,
            isActive: false,
          },
        },
      });

      const { result } = renderHook(() => useUpdateSupplier(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminSupplierService.updateSupplier).toHaveBeenCalledWith(
        "sup-123",
        updateData.data
      );
    });
  });
});
