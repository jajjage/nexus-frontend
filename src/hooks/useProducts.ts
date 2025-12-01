import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { ProductQueryParams } from "@/types/product.types";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductQueryParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: () => productService.getProducts(params),
    // We keep the data fresh for 5 minutes by default (configured in queryClient),
    // but we can override here if needed.
    staleTime: 1000 * 60 * 5,
    select: (response) => response.data, // Return just the payload (products + pagination)
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
}
