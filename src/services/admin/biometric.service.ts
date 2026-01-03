/**
 * Admin Biometric Service
 * API methods for biometric management
 */

import apiClient from "@/lib/api-client";
import {
  ActiveEnrollmentsListResponse,
  ActiveEnrollmentsParams,
  BiometricAuditLogParams,
  BiometricAuditLogResponse,
  BiometricEnrollmentsResponse,
  BiometricStats,
  BiometricStatsParams,
  RevokeAllResponse,
  RevokeEnrollmentResponse,
} from "@/types/admin/biometric.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/biometric";

export const adminBiometricService = {
  /**
   * Get biometric system statistics
   * GET /api/v1/admin/biometric/stats
   */
  getStats: async (
    params?: BiometricStatsParams
  ): Promise<ApiResponse<BiometricStats>> => {
    const response = await apiClient.get<ApiResponse<BiometricStats>>(
      `${BASE_PATH}/stats`,
      { params }
    );
    return response.data;
  },

  /**
   * Get list of all active biometric enrollments
   * GET /api/v1/admin/biometric/active-list
   */
  getActiveList: async (
    params?: ActiveEnrollmentsParams
  ): Promise<ApiResponse<ActiveEnrollmentsListResponse>> => {
    const response = await apiClient.get<
      ApiResponse<ActiveEnrollmentsListResponse>
    >(`${BASE_PATH}/active-list`, { params });
    return response.data;
  },

  /**
   * Get biometric audit log for a user
   * GET /api/v1/admin/biometric/audit-log/:userId
   */
  getAuditLog: async (
    userId: string,
    params?: BiometricAuditLogParams
  ): Promise<ApiResponse<BiometricAuditLogResponse>> => {
    const response = await apiClient.get<
      ApiResponse<BiometricAuditLogResponse>
    >(`${BASE_PATH}/audit-log/${userId}`, { params });
    return response.data;
  },

  /**
   * Get biometric enrollments for a user
   * GET /api/v1/admin/biometric/enrollments/:userId
   */
  getEnrollments: async (
    userId: string
  ): Promise<ApiResponse<BiometricEnrollmentsResponse>> => {
    const response = await apiClient.get<
      ApiResponse<BiometricEnrollmentsResponse>
    >(`${BASE_PATH}/enrollments/${userId}`);
    return response.data;
  },

  /**
   * Revoke a specific biometric enrollment
   * POST /api/v1/admin/biometric/revoke/:enrollmentId
   */
  revokeEnrollment: async (
    enrollmentId: string,
    reason?: string
  ): Promise<ApiResponse<RevokeEnrollmentResponse>> => {
    const response = await apiClient.post<
      ApiResponse<RevokeEnrollmentResponse>
    >(`${BASE_PATH}/revoke/${enrollmentId}`, { reason });
    return response.data;
  },

  /**
   * Revoke all biometric enrollments for a user
   * POST /api/v1/admin/biometric/revoke-all
   */
  revokeAll: async (
    userId: string
  ): Promise<ApiResponse<RevokeAllResponse>> => {
    const response = await apiClient.post<ApiResponse<RevokeAllResponse>>(
      `${BASE_PATH}/revoke-all`,
      { userId }
    );
    return response.data;
  },
};
