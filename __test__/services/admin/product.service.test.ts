/**
 * Product Service Tests
 * Tests for adminProductService methods
 */

import apiClient from "@/lib/api-client";
import { adminProductService } from "@/services/admin/product.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

describe("adminProductService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: "prod-123",
    operatorId: "op-1",
    operatorName: "MTN",
    productCode: "MTN_1GB",
    name: "MTN 1GB Bundle",
    productType: "data",
    denomAmount: 500,
    dataMb: 1024,
    validityDays: 30,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockMapping = {
    id: "map-123",
    productId: "prod-123",
    supplierId: "sup-1",
    supplierProductCode: "SUP_MTN_1GB",
    supplierPrice: 450,
    minOrderAmount: 1,
    maxOrderAmount: 100,
    leadTimeSeconds: 60,
    isActive: true,
  };

  // ============= getProducts Tests =============

  describe("getProducts", () => {
    it("should fetch all products successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Products retrieved",
          data: { products: [mockProduct] },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminProductService.getProducts();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/products", {
        params: undefined,
      });
      expect(result.data!.products).toHaveLength(1);
      expect(result.data!.products[0].name).toBe("MTN 1GB Bundle");
    });

    it("should pass query parameters for filtering", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Products retrieved",
          data: { products: [] },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await adminProductService.getProducts({
        operatorId: "op-1",
        productType: "data",
        isActive: true,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/products", {
        params: {
          operatorId: "op-1",
          productType: "data",
          isActive: true,
        },
      });
    });
  });

  // ============= getProductById Tests =============

  describe("getProductById", () => {
    it("should fetch product by ID successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Product retrieved",
          data: mockProduct,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminProductService.getProductById("prod-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/products/prod-123"
      );
      expect(result.data).toEqual(mockProduct);
    });
  });

  // ============= createProduct Tests =============

  describe("createProduct", () => {
    it("should create product without mapping", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Product created",
          data: { product: mockProduct },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const createData = {
        operatorId: "op-1",
        productCode: "MTN_1GB",
        name: "MTN 1GB Bundle",
        productType: "data",
        denomAmount: 500,
        dataMb: 1024,
        validityDays: 30,
        isActive: true,
      };

      const result = await adminProductService.createProduct(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/products",
        createData
      );
      expect(result.data!.product).toEqual(mockProduct);
    });

    it("should create product with supplier mapping", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Product and mapping created",
          data: { product: mockProduct, mapping: mockMapping },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const createData = {
        operatorId: "op-1",
        productCode: "MTN_1GB",
        name: "MTN 1GB Bundle",
        productType: "data",
        denomAmount: 500,
        supplierId: "sup-1",
        supplierProductCode: "SUP_MTN_1GB",
        supplierPrice: 450,
        mappingIsActive: true,
      };

      const result = await adminProductService.createProduct(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/products",
        createData
      );
      expect(result.data!.product).toEqual(mockProduct);
      expect(result.data!.mapping).toEqual(mockMapping);
    });
  });

  // ============= updateProduct Tests =============

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const updatedProduct = { ...mockProduct, name: "MTN 2GB Bundle" };
      const mockResponse = {
        data: {
          success: true,
          message: "Product updated",
          data: { product: updatedProduct },
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await adminProductService.updateProduct("prod-123", {
        name: "MTN 2GB Bundle",
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/products/prod-123",
        { name: "MTN 2GB Bundle" }
      );
      expect(result.data!.product.name).toBe("MTN 2GB Bundle");
    });

    it("should update multiple fields", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Product updated",
          data: { product: { ...mockProduct, denomAmount: 600, dataMb: 2048 } },
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await adminProductService.updateProduct("prod-123", {
        denomAmount: 600,
        dataMb: 2048,
        isActive: false,
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/products/prod-123",
        { denomAmount: 600, dataMb: 2048, isActive: false }
      );
    });
  });

  // ============= mapProductToSupplier Tests =============

  describe("mapProductToSupplier", () => {
    it("should map product to supplier successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Product mapped to supplier",
          data: { mapping: mockMapping },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const mappingData = {
        supplierId: "sup-1",
        supplierProductCode: "SUP_MTN_1GB",
        supplierPrice: 450,
        minOrderAmount: 1,
        maxOrderAmount: 100,
        leadTimeSeconds: 60,
        isActive: true,
      };

      const result = await adminProductService.mapProductToSupplier(
        "prod-123",
        mappingData
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/products/prod-123/map-to-supplier",
        mappingData
      );
      expect(result.data!.mapping).toEqual(mockMapping);
    });

    it("should map product with minimal data", async () => {
      const minimalMapping = {
        id: "map-456",
        productId: "prod-123",
        supplierId: "sup-2",
        supplierProductCode: "SUP_CODE",
        supplierPrice: 400,
        isActive: true,
      };

      const mockResponse = {
        data: {
          success: true,
          message: "Product mapped to supplier",
          data: { mapping: minimalMapping },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await adminProductService.mapProductToSupplier("prod-123", {
        supplierId: "sup-2",
        supplierProductCode: "SUP_CODE",
        supplierPrice: 400,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/products/prod-123/map-to-supplier",
        {
          supplierId: "sup-2",
          supplierProductCode: "SUP_CODE",
          supplierPrice: 400,
        }
      );
    });
  });
});
