/**
 * Admin Audit Service
 * API methods for audit log management
 */

import apiClient from "@/lib/api-client";
import {
  AuditLogListResponse,
  AuditLogQueryParams,
  AuditLogStatistics,
  RecentAuditEntriesResponse,
  SystemHealth,
  UserActionsResponse,
  UserActivityQueryParams,
  UserActivityResponse,
} from "@/types/admin/audit.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/analytics";

export const adminAuditService = {
  /**
   * Get paginated audit log entries with optional filters
   * GET /api/v1/admin/analytics/audit-log
   */
  getAuditLogs: async (
    params?: AuditLogQueryParams
  ): Promise<ApiResponse<AuditLogListResponse>> => {
    const response = await apiClient.get<ApiResponse<AuditLogListResponse>>(
      `${BASE_PATH}/audit-log`,
      { params }
    );
    return response.data;
  },

  /**
   * Get recent audit log entries
   * GET /api/v1/admin/analytics/audit-log/recent
   */
  getRecentAuditLogs: async (
    minutes: number = 60
  ): Promise<ApiResponse<RecentAuditEntriesResponse>> => {
    const response = await apiClient.get<
      ApiResponse<RecentAuditEntriesResponse>
    >(`${BASE_PATH}/audit-log/recent`, { params: { minutes } });
    return response.data;
  },

  /**
   * Get audit log statistics
   * GET /api/v1/admin/analytics/audit-log/statistics
   */
  getAuditLogStatistics: async (): Promise<ApiResponse<AuditLogStatistics>> => {
    const response = await apiClient.get<ApiResponse<AuditLogStatistics>>(
      `${BASE_PATH}/audit-log/statistics`
    );
    return response.data;
  },

  /**
   * Get system health status
   * GET /api/v1/admin/analytics/system/health
   */
  getSystemHealth: async (): Promise<ApiResponse<SystemHealth>> => {
    const response = await apiClient.get<ApiResponse<SystemHealth>>(
      `${BASE_PATH}/system/health`
    );
    return response.data;
  },

  /**
   * Export audit logs as JSON file
   * GET /api/v1/admin/analytics/audit-log/export
   */
  exportAuditLogs: async (params?: AuditLogQueryParams): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_PATH}/audit-log/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Get actions performed on a specific user (admin actions targeting user)
   * GET /api/v1/admin/analytics/users/:userId/actions
   */
  getUserActions: async (
    userId: string
  ): Promise<ApiResponse<UserActionsResponse>> => {
    const response = await apiClient.get<ApiResponse<UserActionsResponse>>(
      `${BASE_PATH}/users/${userId}/actions`
    );
    return response.data;
  },

  /**
   * Get a user's own activity log (login, topup, etc.)
   * GET /api/v1/admin/analytics/users/:userId/activity
   */
  getUserActivity: async (
    userId: string,
    params?: UserActivityQueryParams
  ): Promise<ApiResponse<UserActivityResponse>> => {
    const response = await apiClient.get<ApiResponse<UserActivityResponse>>(
      `${BASE_PATH}/users/${userId}/activity`,
      { params }
    );
    return response.data;
  },
};
