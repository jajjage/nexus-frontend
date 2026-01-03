/**
 * Product Hooks Tests
 * Tests for useAdminProducts hooks
 */

import {
  useAdminProducts,
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useMapProductToSupplier,
} from "@/hooks/admin/useAdminProducts";
import { adminProductService } from "@/services/admin/product.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the service
vi.mock("@/services/admin/product.service", () => ({
  adminProductService: {
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    mapProductToSupplier: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockService = adminProductService as unknown as {
  getProducts: ReturnType<typeof vi.fn>;
  getProductById: ReturnType<typeof vi.fn>;
  createProduct: ReturnType<typeof vi.fn>;
  updateProduct: ReturnType<typeof vi.fn>;
  mapProductToSupplier: ReturnType<typeof vi.fn>;
};

describe("Product Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockProduct = {
    id: "prod-123",
    operatorId: "op-1",
    productCode: "MTN_1GB",
    name: "MTN 1GB Bundle",
    productType: "data",
    denomAmount: 500,
    dataMb: 1024,
    isActive: true,
  };

  const mockMapping = {
    id: "map-123",
    productId: "prod-123",
    supplierId: "sup-1",
    supplierProductCode: "SUP_MTN_1GB",
    supplierPrice: 450,
    isActive: true,
  };

  // ============= useAdminProducts Tests =============

  describe("useAdminProducts", () => {
    it("should fetch products list", async () => {
      const mockResponse = {
        success: true,
        message: "Products retrieved",
        data: { products: [mockProduct] },
      };

      mockService.getProducts.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminProducts(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data?.products).toHaveLength(1);
      expect(result.current.data?.data?.products[0].name).toBe(
        "MTN 1GB Bundle"
      );
    });

    it("should pass query params to service", async () => {
      const mockResponse = {
        success: true,
        data: { products: [] },
      };

      mockService.getProducts.mockResolvedValue(mockResponse);

      renderHook(
        () => useAdminProducts({ operatorId: "op-1", productType: "data" }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockService.getProducts).toHaveBeenCalledWith({
          operatorId: "op-1",
          productType: "data",
        });
      });
    });
  });

  // ============= useAdminProduct Tests =============

  describe("useAdminProduct", () => {
    it("should fetch single product by ID", async () => {
      const mockResponse = {
        success: true,
        message: "Product fetched",
        data: mockProduct,
      };

      mockService.getProductById.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminProduct("prod-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockProduct);
    });

    it("should not fetch if productId is empty", async () => {
      const { result } = renderHook(() => useAdminProduct(""), { wrapper });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockService.getProductById).not.toHaveBeenCalled();
    });
  });

  // ============= useCreateProduct Tests =============

  describe("useCreateProduct", () => {
    it("should create product successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Product created",
        data: { product: mockProduct },
      };

      mockService.createProduct.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateProduct(), { wrapper });

      result.current.mutate({
        operatorId: "op-1",
        productCode: "MTN_1GB",
        name: "MTN 1GB Bundle",
        productType: "data",
        denomAmount: 500,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createProduct).toHaveBeenCalledWith({
        operatorId: "op-1",
        productCode: "MTN_1GB",
        name: "MTN 1GB Bundle",
        productType: "data",
        denomAmount: 500,
      });
    });

    it("should create product with supplier mapping", async () => {
      const mockResponse = {
        success: true,
        message: "Product and mapping created",
        data: { product: mockProduct, mapping: mockMapping },
      };

      mockService.createProduct.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateProduct(), { wrapper });

      result.current.mutate({
        operatorId: "op-1",
        productCode: "MTN_1GB",
        name: "MTN 1GB Bundle",
        productType: "data",
        denomAmount: 500,
        supplierId: "sup-1",
        supplierProductCode: "SUP_MTN_1GB",
        supplierPrice: 450,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data?.mapping).toEqual(mockMapping);
    });
  });

  // ============= useUpdateProduct Tests =============

  describe("useUpdateProduct", () => {
    it("should update product successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Product updated",
        data: { product: { ...mockProduct, name: "MTN 2GB Bundle" } },
      };

      mockService.updateProduct.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateProduct(), { wrapper });

      result.current.mutate({
        productId: "prod-123",
        data: { name: "MTN 2GB Bundle" },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.updateProduct).toHaveBeenCalledWith("prod-123", {
        name: "MTN 2GB Bundle",
      });
    });
  });

  // ============= useMapProductToSupplier Tests =============

  describe("useMapProductToSupplier", () => {
    it("should map product to supplier successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Product mapped to supplier",
        data: { mapping: mockMapping },
      };

      mockService.mapProductToSupplier.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMapProductToSupplier(), {
        wrapper,
      });

      result.current.mutate({
        productId: "prod-123",
        data: {
          supplierId: "sup-1",
          supplierProductCode: "SUP_MTN_1GB",
          supplierPrice: 450,
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.mapProductToSupplier).toHaveBeenCalledWith(
        "prod-123",
        {
          supplierId: "sup-1",
          supplierProductCode: "SUP_MTN_1GB",
          supplierPrice: 450,
        }
      );
    });
  });
});
