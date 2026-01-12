/**
 * Admin Notification Management Hooks
 * React Query hooks for notification CRUD and template operations
 */

"use client";

import { adminNotificationService } from "@/services/admin/notification.service";
import {
  CreateFromTemplateRequest,
  CreateNotificationRequest,
  CreateTemplateRequest,
  NotificationQueryParams,
  ScheduleNotificationRequest,
  UpdateNotificationRequest,
} from "@/types/admin/notification.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const notificationKeys = {
  all: ["admin", "notifications"] as const,
  list: (params?: NotificationQueryParams) =>
    [...notificationKeys.all, "list", params] as const,
  detail: (id: string) => [...notificationKeys.all, "detail", id] as const,
  analytics: (id: string) =>
    [...notificationKeys.all, "analytics", id] as const,
  templates: ["admin", "notification-templates"] as const,
  template: (id: string) => [...notificationKeys.all, "template", id] as const,
};

/**
 * Fetch notifications with optional filtering
 */
export function useAdminNotifications(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => adminNotificationService.getNotifications(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch notification analytics
 */
export function useNotificationAnalytics(notificationId: string) {
  return useQuery({
    queryKey: notificationKeys.analytics(notificationId),
    queryFn: () =>
      adminNotificationService.getNotificationAnalytics(notificationId),
    enabled: !!notificationId,
  });
}

/**
 * Fetch a single notification by ID
 */
export function useAdminNotification(notificationId: string) {
  return useQuery({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => adminNotificationService.getNotificationById(notificationId),
    enabled: !!notificationId,
  });
}

/**
 * Fetch notification templates
 */
export function useNotificationTemplates() {
  return useQuery({
    queryKey: notificationKeys.templates,
    queryFn: () => adminNotificationService.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single template by ID
 */
export function useNotificationTemplate(templateId: string) {
  return useQuery({
    queryKey: notificationKeys.template(templateId),
    queryFn: () => adminNotificationService.getTemplateById(templateId),
    enabled: !!templateId,
  });
}

/**
 * Create a new notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationRequest) =>
      adminNotificationService.createNotification(data),
    onSuccess: (response) => {
      toast.success(response.message || "Notification created successfully");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to create notification"
      );
    },
  });
}

/**
 * Schedule a notification with target criteria
 */
export function useScheduleNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleNotificationRequest) =>
      adminNotificationService.scheduleNotification(data),
    onSuccess: (response) => {
      toast.success(response.message || "Notification scheduled successfully");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to schedule notification"
      );
    },
  });
}

/**
 * Update a notification
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      data,
    }: {
      notificationId: string;
      data: UpdateNotificationRequest;
    }) => adminNotificationService.updateNotification(notificationId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Notification updated successfully");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to update notification"
      );
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      adminNotificationService.deleteNotification(notificationId),
    onSuccess: (response) => {
      toast.success(response.message || "Notification deleted");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to delete notification"
      );
    },
  });
}

/**
 * Create notification from template
 */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFromTemplateRequest) =>
      adminNotificationService.createFromTemplate(data),
    onSuccess: (response) => {
      toast.success(response.message || "Notification created from template");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to create notification from template"
      );
    },
  });
}

/**
 * Create a notification template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateRequest) =>
      adminNotificationService.createTemplate(data),
    onSuccess: (response) => {
      toast.success(response.message || "Template created successfully");
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create template");
    },
  });
}

/**
 * Delete a notification template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      adminNotificationService.deleteTemplate(templateId),
    onSuccess: (response) => {
      toast.success(response.message || "Template deleted");
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to delete template");
    },
  });
}
