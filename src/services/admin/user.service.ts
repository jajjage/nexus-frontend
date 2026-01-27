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

// Helper to map API response (snake_case) to Frontend type (camelCase)
const mapFromApiUser = (apiUser: any): AdminUser => {
  return {
    id: apiUser.id,
    userId: apiUser.user_id || apiUser.userId,
    fullName: apiUser.full_name || apiUser.fullName,
    email: apiUser.email,
    phoneNumber: apiUser.phone_number || apiUser.phoneNumber,
    role: apiUser.role,
    isVerified: apiUser.is_verified || apiUser.isVerified,
    isSuspended: apiUser.is_suspended || apiUser.isSuspended,
    twoFactorEnabled: apiUser.two_factor_enabled || apiUser.twoFactorEnabled,
    balance: apiUser.balance,
    createdAt: apiUser.created_at || apiUser.createdAt,
    updatedAt: apiUser.updated_at || apiUser.updatedAt,
  };
};

export const adminUserService = {
  /**
   * Get all users with pagination
   */
  getUsers: async (
    params?: AdminUserQueryParams
  ): Promise<ApiResponse<AdminUserListResponse>> => {
    const response = await apiClient.get<any>(BASE_PATH, { params });

    // Map users in the list
    if (response.data.success && response.data.data?.users) {
      response.data.data.users = response.data.data.users.map(mapFromApiUser);
    }

    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.get<any>(`${BASE_PATH}/${userId}`);

    if (response.data.success && response.data.data) {
      const rawData = response.data.data.user || response.data.data;
      response.data.data = mapFromApiUser(rawData);
    }

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
    const response = await apiClient.put<any>(`${BASE_PATH}/${userId}`, data);

    if (response.data.success && response.data.data) {
      const rawData = response.data.data.user || response.data.data;
      response.data.data = mapFromApiUser(rawData);
    }

    return response.data;
  },

  /**
   * Suspend a user
   */
  suspendUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<any>(
      `${BASE_PATH}/${userId}/suspend`
    );

    // If the API returns updated user data, map it
    if (response.data.success && response.data.data?.user) {
      response.data.data.user = mapFromApiUser(response.data.data.user);
    }

    return response.data;
  },

  /**
   * Unsuspend a user
   */
  unsuspendUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<any>(
      `${BASE_PATH}/${userId}/unsuspend`
    );

    // If the API returns updated user data, map it
    if (response.data.success && response.data.data?.user) {
      response.data.data.user = mapFromApiUser(response.data.data.user);
    }

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
   * Verify 2FA OTP and enable 2FA for a user
   */
  verify2FA: async (
    userId: string,
    code: string
  ): Promise<ApiResponse<{ enabled: boolean }>> => {
    const response = await apiClient.post<ApiResponse<{ enabled: boolean }>>(
      `${BASE_PATH}/${userId}/2fa/verify`,
      { code }
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
   * Force-enable 2FA for a user (Admin creates credentials for user)
   * Returns QR code, secret, and backup codes that admin can give to user
   */
  enable2FA: async (
    userId: string
  ): Promise<ApiResponse<AdminSetup2FAResponse>> => {
    const response = await apiClient.post<ApiResponse<AdminSetup2FAResponse>>(
      `${BASE_PATH}/${userId}/2fa/enable`
    );
    return response.data;
  },

  /**
   * Get 2FA status for a user
   */
  get2FAStatus: async (
    userId: string
  ): Promise<ApiResponse<{ enabled: boolean; roleRequires2FA?: boolean }>> => {
    const response = await apiClient.get<
      ApiResponse<{ enabled: boolean; roleRequires2FA?: boolean }>
    >(`${BASE_PATH}/${userId}/2fa/status`);
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

  /**
   * Verify a user (manually mark as verified)
   */
  verifyUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `${BASE_PATH}/${userId}/verify`
    );
    return response.data;
  },
};
