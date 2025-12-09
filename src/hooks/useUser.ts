import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import {
  UpdateProfileRequest,
  UpdatePasswordRequest,
  SetPinRequest,
  GetPurchasesParams,
  TopupRequest,
} from "@/types/user.types";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

// ============= Query Keys =============
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  purchases: {
    all: () => [...userKeys.all, "purchases"] as const,
    list: (params?: GetPurchasesParams) =>
      [...userKeys.purchases.all(), params] as const,
    detail: (id: string) => [...userKeys.purchases.all(), id] as const,
  },
};

// ============= Profile Queries =============

/**
 * Get current user's profile
 */
export const useProfile = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/**
 * Update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateProfile(data),
    onSuccess: (data) => {
      // Update the profile cache
      queryClient.setQueryData(userKeys.profile(), data);
      // Also invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
    onError: (error: AxiosError<any>) => {
      console.error("Profile update failed:", error.response?.data?.message);
    },
  });
};

/**
 * Update user password
 */
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: UpdatePasswordRequest) =>
      userService.updatePassword(data),
    onError: (error: AxiosError<any>) => {
      console.error("Password update failed:", error.response?.data?.message);
    },
  });
};

/**
 * Set or update transaction PIN
 */
export const useSetPin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetPinRequest) => userService.setPin(data),
    onSuccess: (data) => {
      // Invalidate profile to update hasPin status
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
    onError: (error: AxiosError<any>) => {
      console.error("Set PIN failed:", error.response?.data?.message);
    },
  });
};

// ============= Purchase Queries =============

/**
 * Get user's purchase history with filters
 */
export const usePurchases = (params?: GetPurchasesParams) => {
  return useQuery({
    queryKey: userKeys.purchases.list(params),
    queryFn: () => userService.getPurchases(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
  });
};

/**
 * Get single purchase by ID
 */
export const usePurchase = (id: string) => {
  return useQuery({
    queryKey: userKeys.purchases.detail(id),
    queryFn: () => userService.getPurchaseById(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    enabled: !!id,
  });
};

/**
 * Get recent purchases (last 10)
 */
export const useRecentPurchases = () => {
  return usePurchases({ page: 1, limit: 10 });
};

/**
 * Get pending purchases
 */
export const usePendingPurchases = () => {
  return usePurchases({ status: "PENDING" as any, page: 1, limit: 20 });
};

/**
 * Get purchases by type
 */
export const usePurchasesByType = (type: string) => {
  return usePurchases({ type: type as any, page: 1, limit: 20 });
};

// ============= Topup Mutations =============

/**
 * Create a new topup/purchase
 */
export const useCreateTopup = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: TopupRequest) => userService.createTopup(data),
    onSuccess: (data) => {
      // Invalidate purchases to show new purchase
      queryClient.invalidateQueries({ queryKey: userKeys.purchases.all() });
      // Invalidate wallet balance as it changed
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });

      // Navigate to purchase details or success page
      router.push(`/dashboard/purchases/${data.data.purchase.id}`);
    },
    onError: (error: AxiosError<any>) => {
      console.error("Topup failed:", error.response?.data?.message);
    },
  });
};

/**
 * Create topup with custom success handler
 */
export const useCreateTopupWithCallback = (
  onSuccessCallback?: (data: any) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TopupRequest) => userService.createTopup(data),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: userKeys.purchases.all() });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      // Call custom callback
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: AxiosError<any>) => {
      console.error("Topup failed:", error.response?.data?.message);
    },
  });
};
