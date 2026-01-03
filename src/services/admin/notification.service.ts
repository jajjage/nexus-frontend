/**
 * Admin Notification Service
 * API methods for notification management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateFromTemplateRequest,
  CreateNotificationRequest,
  CreateTemplateRequest,
  Notification,
  NotificationAnalytics,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationTemplate,
  ScheduleNotificationRequest,
  UpdateNotificationRequest,
} from "@/types/admin/notification.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/notifications";

export const adminNotificationService = {
  /**
   * List all notifications with optional filtering
   * GET /api/v1/admin/notifications
   */
  getNotifications: async (
    params?: NotificationQueryParams
  ): Promise<ApiResponse<NotificationListResponse>> => {
    const response = await apiClient.get<ApiResponse<NotificationListResponse>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  },

  /**
   * Create a new notification
   * POST /api/v1/admin/notifications
   */
  createNotification: async (
    data: CreateNotificationRequest
  ): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await apiClient.post<
      ApiResponse<{ notification: Notification }>
    >(BASE_PATH, data);
    return response.data;
  },

  /**
   * Schedule a notification with target criteria
   * POST /api/v1/admin/notifications/schedule
   */
  scheduleNotification: async (
    data: ScheduleNotificationRequest
  ): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.post<ApiResponse<Notification>>(
      `${BASE_PATH}/schedule`,
      data
    );
    return response.data;
  },

  /**
   * Update a notification
   * PATCH /api/v1/admin/notifications/:notificationId
   */
  updateNotification: async (
    notificationId: string,
    data: UpdateNotificationRequest
  ): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await apiClient.patch<
      ApiResponse<{ notification: Notification }>
    >(`${BASE_PATH}/${notificationId}`, data);
    return response.data;
  },

  /**
   * Delete a notification
   * DELETE /api/v1/admin/notifications/:notificationId
   */
  deleteNotification: async (
    notificationId: string
  ): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${BASE_PATH}/${notificationId}`
    );
    return response.data;
  },

  /**
   * Get notification analytics
   * GET /api/v1/admin/notifications/:notificationId/analytics
   */
  getNotificationAnalytics: async (
    notificationId: string
  ): Promise<ApiResponse<NotificationAnalytics>> => {
    const response = await apiClient.get<ApiResponse<NotificationAnalytics>>(
      `${BASE_PATH}/${notificationId}/analytics`
    );
    return response.data;
  },

  /**
   * Create notification from template
   * POST /api/v1/admin/notifications/from-template
   */
  createFromTemplate: async (
    data: CreateFromTemplateRequest
  ): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await apiClient.post<
      ApiResponse<{ notification: Notification }>
    >(`${BASE_PATH}/from-template`, data);
    return response.data;
  },

  /**
   * List all notification templates
   * GET /api/v1/admin/notifications/templates
   */
  getTemplates: async (): Promise<ApiResponse<NotificationTemplate[]>> => {
    const response = await apiClient.get<ApiResponse<NotificationTemplate[]>>(
      `${BASE_PATH}/templates`
    );
    return response.data;
  },

  /**
   * Get a single template by ID
   * GET /api/v1/admin/notifications/templates/:templateId
   */
  getTemplateById: async (
    templateId: string
  ): Promise<ApiResponse<NotificationTemplate>> => {
    const response = await apiClient.get<ApiResponse<NotificationTemplate>>(
      `${BASE_PATH}/templates/${templateId}`
    );
    return response.data;
  },

  /**
   * Create a notification template
   * POST /api/v1/admin/notifications/templates
   */
  createTemplate: async (
    data: CreateTemplateRequest
  ): Promise<ApiResponse<{ template: NotificationTemplate }>> => {
    const response = await apiClient.post<
      ApiResponse<{ template: NotificationTemplate }>
    >(`${BASE_PATH}/templates`, data);
    return response.data;
  },

  /**
   * Delete a notification template
   * DELETE /api/v1/admin/notifications/templates/:templateId
   */
  deleteTemplate: async (templateId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${BASE_PATH}/templates/${templateId}`
    );
    return response.data;
  },
};
