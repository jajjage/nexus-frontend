/**
 * Admin Product Service
 * API methods for product management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateProductRequest,
  MapProductToSupplierRequest,
  Product,
  ProductListResponse,
  ProductQueryParams,
  ProductWithMappingResponse,
  SupplierProductMapping,
  UpdateProductRequest,
} from "@/types/admin/product.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/products";

export const adminProductService = {
  /**
   * Get all products with optional filtering
   * GET /api/v1/admin/products
   */
  getProducts: async (
    params?: ProductQueryParams
  ): Promise<ApiResponse<ProductListResponse>> => {
    const response = await apiClient.get<ApiResponse<ProductListResponse>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single product by ID
   * GET /api/v1/admin/products/:productId
   */
  getProductById: async (productId: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get<ApiResponse<Product>>(
      `${BASE_PATH}/${productId}`
    );
    return response.data;
  },

  /**
   * Create a new product (optionally with supplier mapping)
   * POST /api/v1/admin/products
   */
  createProduct: async (
    data: CreateProductRequest
  ): Promise<ApiResponse<ProductWithMappingResponse>> => {
    const response = await apiClient.post<
      ApiResponse<ProductWithMappingResponse>
    >(BASE_PATH, data);
    return response.data;
  },

  /**
   * Update a product
   * PUT /api/v1/admin/products/:productId
   */
  updateProduct: async (
    productId: string,
    data: UpdateProductRequest
  ): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.put<ApiResponse<{ product: Product }>>(
      `${BASE_PATH}/${productId}`,
      data
    );
    return response.data;
  },

  /**
   * Map a product to a supplier
   * POST /api/v1/admin/products/:productId/map-to-supplier
   */
  mapProductToSupplier: async (
    productId: string,
    data: MapProductToSupplierRequest
  ): Promise<ApiResponse<{ mapping: SupplierProductMapping }>> => {
    const response = await apiClient.post<
      ApiResponse<{ mapping: SupplierProductMapping }>
    >(`${BASE_PATH}/${productId}/map-to-supplier`, data);
    return response.data;
  },
};
