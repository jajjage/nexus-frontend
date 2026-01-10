"use client";

import {
  categoryService,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/services/category.service";
import { ProductCategory } from "@/types/product.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to fetch all categories (admin)
 */
export function useAdminCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ["admin", "categories"],
    queryFn: categoryService.adminGetAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryService.create(data),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category");
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update category");
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    },
  });
}
