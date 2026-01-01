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
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => adminUserService.getUsers(params),
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
      toast.error(error.response?.data?.message || "Failed to create user");
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
