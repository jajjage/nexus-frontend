/**
 * Admin Notification Service
 * API methods for notification management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateFromTemplateWithScheduleRequest,
  CreateNotificationRequest,
  CreateTemplateRequest,
  Notification,
  NotificationAnalytics,
  NotificationDispatch,
  NotificationDispatchesResponse,
  NotificationDispatchQueryParams,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationRecurrence,
  NotificationResendResponse,
  NotificationTemplate,
  ResendNotificationRequest,
  ScheduleNotificationRequest,
  UpsertNotificationRecurrenceRequest,
  UpdateNotificationRequest,
} from "@/types/admin/notification.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/notifications";

const normalizeNotification = (raw: any): Notification => ({
  ...(raw ?? {}),
});

const extractNotification = (payload: any): Notification | null => {
  const candidates = [
    payload?.data?.notification,
    payload?.data?.data?.notification,
    payload?.data?.data,
    payload?.notification,
    payload?.data,
    payload,
  ];

  const found = candidates.find(
    (candidate) =>
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      (candidate.id || candidate.title || candidate.body || candidate.type)
  );

  return found ? normalizeNotification(found) : null;
};

const normalizeDispatch = (raw: any): NotificationDispatch => ({
  id: raw?.id ?? "",
  notificationId: raw?.notificationId ?? raw?.notification_id ?? "",
  trigger: raw?.trigger ?? "initial",
  status: raw?.status ?? "queued",
  attempts: Number(raw?.attempts ?? 0),
  maxAttempts: Number(raw?.maxAttempts ?? raw?.max_attempts ?? 0),
  scheduledFor: raw?.scheduledFor ?? raw?.scheduled_for ?? null,
  sentAt: raw?.sentAt ?? raw?.sent_at ?? null,
  lastError: raw?.lastError ?? raw?.last_error ?? null,
  createdAt: raw?.createdAt ?? raw?.created_at ?? new Date(0).toISOString(),
});

const normalizeRecurrence = (raw: any): NotificationRecurrence => ({
  id: raw?.id ?? "",
  notificationId: raw?.notificationId ?? raw?.notification_id ?? "",
  timeOfDay: raw?.timeOfDay ?? raw?.time_of_day ?? "08:00",
  timezone: raw?.timezone ?? "UTC",
  isActive: Boolean(raw?.isActive ?? raw?.is_active ?? false),
  lastRunAt: raw?.lastRunAt ?? raw?.last_run_at ?? null,
});

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
   * Get a single notification by ID
   * GET /api/v1/admin/notifications/:notificationId
   */
  getNotificationById: async (
    notificationId: string
  ): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await apiClient.get<
      ApiResponse<{ notification: Notification }>
    >(`${BASE_PATH}/${notificationId}`);
    const rawNotification = extractNotification(response.data);
    return {
      ...response.data,
      data: {
        notification: rawNotification ?? normalizeNotification(null),
      },
    };
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
    data: CreateFromTemplateWithScheduleRequest
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

  /**
   * Resend an existing notification now or later
   * POST /api/v1/admin/notifications/:notificationId/resend
   */
  resendNotification: async (
    notificationId: string,
    data?: ResendNotificationRequest
  ): Promise<ApiResponse<NotificationResendResponse>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${BASE_PATH}/${notificationId}/resend`,
      data ?? {}
    );

    const rawData = response.data?.data ?? {};
    return {
      ...response.data,
      data: {
        notification: rawData.notification ?? rawData,
        dispatch: normalizeDispatch(rawData.dispatch ?? rawData),
      },
    };
  },

  /**
   * Get dispatch history for a notification
   * GET /api/v1/admin/notifications/:notificationId/dispatches
   */
  getNotificationDispatches: async (
    notificationId: string,
    params?: NotificationDispatchQueryParams
  ): Promise<ApiResponse<NotificationDispatchesResponse>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_PATH}/${notificationId}/dispatches`,
      { params }
    );

    const rawData = response.data?.data ?? {};
    const rawDispatches = Array.isArray(rawData)
      ? rawData
      : rawData.dispatches ?? [];

    return {
      ...response.data,
      data: {
        dispatches: rawDispatches.map(normalizeDispatch),
        total: rawData.total,
        limit: rawData.limit,
        offset: rawData.offset,
        hasMore: rawData.hasMore ?? rawData.has_more,
      },
    };
  },

  /**
   * Get daily recurrence config
   * GET /api/v1/admin/notifications/:notificationId/recurrence
   */
  getNotificationRecurrence: async (
    notificationId: string
  ): Promise<ApiResponse<NotificationRecurrence>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_PATH}/${notificationId}/recurrence`
    );
    const raw = response.data?.data ?? {};
    return {
      ...response.data,
      data: normalizeRecurrence(raw),
    };
  },

  /**
   * Upsert daily recurrence config
   * PUT /api/v1/admin/notifications/:notificationId/recurrence
   */
  upsertNotificationRecurrence: async (
    notificationId: string,
    data: UpsertNotificationRecurrenceRequest
  ): Promise<ApiResponse<NotificationRecurrence>> => {
    const response = await apiClient.put<ApiResponse<any>>(
      `${BASE_PATH}/${notificationId}/recurrence`,
      data
    );
    const raw = response.data?.data ?? {};
    return {
      ...response.data,
      data: normalizeRecurrence(raw),
    };
  },
};
