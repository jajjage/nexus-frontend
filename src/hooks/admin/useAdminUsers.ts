/**
 * Admin User Management Hooks
 * React Query hooks for user CRUD operations
 */

"use client";

import { adminUserService } from "@/services/admin/user.service";
import {
  AdminUserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  WalletTransactionRequest,
} from "@/types/admin/user.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (params?: AdminUserQueryParams) =>
    [...adminUserKeys.all, "list", params] as const,
  detail: (userId: string) => [...adminUserKeys.all, "detail", userId] as const,
  sessions: (userId: string) =>
    [...adminUserKeys.all, "sessions", userId] as const,
};

/**
 * Fetch paginated list of users
 */
export function useAdminUsers(params?: AdminUserQueryParams) {
  const { page = 1, limit = 10, search, role } = params || {};

  return useQuery({
    queryKey: adminUserKeys.list({ page, limit, search, role }),
    queryFn: () => adminUserService.getUsers({ page, limit, search, role }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single user details
 */
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId),
    queryFn: () => adminUserService.getUserById(userId),
    enabled: !!userId,
  });
}

/**
 * Fetch user sessions
 */
export function useAdminUserSessions(userId: string) {
  return useQuery({
    queryKey: adminUserKeys.sessions(userId),
    queryFn: () => adminUserService.getUserSessions(userId),
    enabled: !!userId,
  });
}

/**
 * Create new user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => adminUserService.createUser(data),
    onSuccess: (response) => {
      toast.success(response.message || "User created successfully");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      const serverError = error.response?.data;
      let errorMessage = serverError?.message || "Failed to create user";

      // If there are specific field errors, append them
      if (serverError?.errors && typeof serverError.errors === "object") {
        const fieldErrors = Object.entries(serverError.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        if (fieldErrors) {
          errorMessage += ` (${fieldErrors})`;
        }
      }

      toast.error(errorMessage);
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserRequest;
    }) => adminUserService.updateUser(userId, data),
    onSuccess: (response, { userId }) => {
      toast.success(response.message || "User updated successfully");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });
}

/**
 * Suspend user mutation
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUserService.suspendUser(userId),
    onSuccess: (response, userId) => {
      toast.success(response.message || "User suspended");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to suspend user");
    },
  });
}

/**
 * Unsuspend user mutation
 */
export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUserService.unsuspendUser(userId),
    onSuccess: (response, userId) => {
      toast.success(response.message || "User unsuspended");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.list() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to unsuspend user");
    },
  });
}

/**
 * Credit wallet mutation
 */
export function useCreditWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: WalletTransactionRequest;
    }) => adminUserService.creditWallet(userId, data),
    onSuccess: (response, { userId }) => {
      toast.success(
        response.message ||
          `Wallet credited. New balance: ${response.data?.newBalance}`
      );
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to credit wallet");
    },
  });
}

/**
 * Debit wallet mutation
 */
export function useDebitWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: WalletTransactionRequest;
    }) => adminUserService.debitWallet(userId, data),
    onSuccess: (response, { userId }) => {
      toast.success(
        response.message ||
          `Wallet debited. New balance: ${response.data?.newBalance}`
      );
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to debit wallet");
    },
  });
}

/**
 * Setup 2FA mutation (Admin-initiated)
 */
export function useSetup2FA() {
  return useMutation({
    mutationFn: (userId: string) => adminUserService.setup2FA(userId),
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to setup 2FA");
    },
  });
}

/**
 * Verify 2FA mutation (Admin-initiated)
 */
export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, code }: { userId: string; code: string }) =>
      adminUserService.verify2FA(userId, code),
    onSuccess: (response, { userId }) => {
      toast.success(response.message || "2FA enabled successfully");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Invalid OTP code");
    },
  });
}

/**
 * Disable 2FA mutation
 */
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUserService.disable2FA(userId),
    onSuccess: (response, userId) => {
      toast.success(response.message || "2FA disabled for user");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to disable 2FA");
    },
  });
}

/**
 * Force-enable 2FA mutation (Admin creates credentials for user)
 * Returns QR code, secret, and backup codes to share with user
 */
export function useEnable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUserService.enable2FA(userId),
    onSuccess: (response, userId) => {
      toast.success(response.message || "2FA enabled for user");
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to enable 2FA");
    },
  });
}

/**
 * Fetch 2FA status for a user
 */
export function useAdmin2FAStatus(userId: string) {
  return useQuery({
    queryKey: [...adminUserKeys.detail(userId), "2fa-status"],
    queryFn: () => adminUserService.get2FAStatus(userId),
    enabled: !!userId,
  });
}

/**
 * Revoke sessions mutation
 */
export function useRevokeUserSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUserService.revokeUserSessions(userId),
    onSuccess: (response, userId) => {
      toast.success(
        response.message ||
          `${response.data?.sessionsRevoked} session(s) revoked`
      );
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.sessions(userId),
      });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to revoke sessions");
    },
  });
}
