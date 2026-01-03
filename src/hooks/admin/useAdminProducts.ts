/**
 * Admin Product Management Hooks
 * React Query hooks for product CRUD and supplier mapping operations
 */

"use client";

import { adminProductService } from "@/services/admin/product.service";
import {
  CreateProductRequest,
  MapProductToSupplierRequest,
  ProductQueryParams,
  UpdateProductRequest,
} from "@/types/admin/product.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const productKeys = {
  all: ["admin", "products"] as const,
  list: (params?: ProductQueryParams) =>
    [...productKeys.all, "list", params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

/**
 * Fetch products with optional filtering
 */
export function useAdminProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => adminProductService.getProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single product details
 */
export function useAdminProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => adminProductService.getProductById(productId),
    enabled: !!productId,
  });
}

/**
 * Create new product (optionally with supplier mapping)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      adminProductService.createProduct(data),
    onSuccess: (response) => {
      toast.success(response.message || "Product created successfully");
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });
}

/**
 * Update product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductRequest;
    }) => adminProductService.updateProduct(productId, data),
    onSuccess: (response, { productId }) => {
      toast.success(response.message || "Product updated successfully");
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });
}

/**
 * Map product to supplier
 */
export function useMapProductToSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: MapProductToSupplierRequest;
    }) => adminProductService.mapProductToSupplier(productId, data),
    onSuccess: (response, { productId }) => {
      toast.success(response.message || "Product mapped to supplier");
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to map product to supplier"
      );
    },
  });
}
