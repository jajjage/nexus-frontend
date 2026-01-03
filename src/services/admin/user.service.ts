/**
 * Admin User Service
 * API methods for user management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  AdminSetup2FAResponse,
  AdminUser,
  AdminUserListResponse,
  AdminUserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  UserSessionsResponse,
  WalletTransactionRequest,
} from "@/types/admin/user.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/users";

export const adminUserService = {
  /**
   * Get all users with pagination
   */
  getUsers: async (
    params?: AdminUserQueryParams
  ): Promise<ApiResponse<AdminUserListResponse>> => {
    const response = await apiClient.get<ApiResponse<AdminUserListResponse>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.get<ApiResponse<AdminUser>>(
      `${BASE_PATH}/${userId}`
    );
    return response.data;
  },

  /**
   * Create a new user
   */
  createUser: async (
    data: CreateUserRequest
  ): Promise<ApiResponse<{ id: string; email: string }>> => {
    const response = await apiClient.post<
      ApiResponse<{ id: string; email: string }>
    >(BASE_PATH, data);
    return response.data;
  },

  /**
   * Update user details
   */
  updateUser: async (
    userId: string,
    data: UpdateUserRequest
  ): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.put<ApiResponse<AdminUser>>(
      `${BASE_PATH}/${userId}`,
      data
    );
    return response.data;
  },

  /**
   * Suspend a user
   */
  suspendUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${userId}/suspend`
    );
    return response.data;
  },

  /**
   * Unsuspend a user
   */
  unsuspendUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${userId}/unsuspend`
    );
    return response.data;
  },

  /**
   * Credit user wallet
   */
  creditWallet: async (
    userId: string,
    data: WalletTransactionRequest
  ): Promise<ApiResponse<{ newBalance: number }>> => {
    const response = await apiClient.post<ApiResponse<{ newBalance: number }>>(
      `${BASE_PATH}/${userId}/credit`,
      data
    );
    return response.data;
  },

  /**
   * Debit user wallet
   */
  debitWallet: async (
    userId: string,
    data: WalletTransactionRequest
  ): Promise<ApiResponse<{ newBalance: number }>> => {
    const response = await apiClient.post<ApiResponse<{ newBalance: number }>>(
      `${BASE_PATH}/${userId}/debit`,
      data
    );
    return response.data;
  },

  /**
   * Setup 2FA for a user (Admin-initiated)
   */
  setup2FA: async (
    userId: string
  ): Promise<ApiResponse<AdminSetup2FAResponse>> => {
    const response = await apiClient.post<ApiResponse<AdminSetup2FAResponse>>(
      `${BASE_PATH}/${userId}/2fa/setup`
    );
    return response.data;
  },

  /**
   * Disable 2FA for a user
   */
  disable2FA: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${userId}/2fa/disable`
    );
    return response.data;
  },

  /**
   * Get user sessions
   */
  getUserSessions: async (
    userId: string
  ): Promise<ApiResponse<UserSessionsResponse>> => {
    const response = await apiClient.get<ApiResponse<UserSessionsResponse>>(
      `${BASE_PATH}/${userId}/sessions`
    );
    return response.data;
  },

  /**
   * Revoke all user sessions
   */
  revokeUserSessions: async (
    userId: string
  ): Promise<ApiResponse<{ sessionsRevoked: number }>> => {
    const response = await apiClient.delete<
      ApiResponse<{ sessionsRevoked: number }>
    >(`${BASE_PATH}/${userId}/sessions`);
    return response.data;
  },

  /**
   * Get inactive users
   */
  getInactiveUsers: async (
    inactiveSince: string
  ): Promise<ApiResponse<{ inactiveUsers: AdminUser[] }>> => {
    const response = await apiClient.get<
      ApiResponse<{ inactiveUsers: AdminUser[] }>
    >(`${BASE_PATH}/inactive`, {
      params: { inactiveSince },
    });
    return response.data;
  },
};
