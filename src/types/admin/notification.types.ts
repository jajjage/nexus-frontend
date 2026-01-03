/**
 * Admin Notification Types
 * Based on ADMIN_GUIDE.md Notification Management section
 */

// ============= Notification Types =============

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "alert";

// Target criteria for scheduled notifications
export interface NotificationTargetCriteria {
  registrationDateRange?: {
    start: string;
    end: string;
  };
  minTransactionCount?: number;
  maxTransactionCount?: number;
  minTopupCount?: number;
  maxTopupCount?: number;
  lastActiveWithinDays?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  target?: NotificationTargetCriteria;
  targetCriteria?: NotificationTargetCriteria;
  publish_at?: string;
  publishAt?: string;
  created_by?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  sent?: boolean;
  archived?: boolean;
  isArchived?: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Analytics for a notification
export interface NotificationAnalytics {
  notificationId: string;
  totalSent?: number;
  totalDelivered?: number;
  totalRead?: number;
  totalClicked?: number;
  deliveryRate?: number;
  readRate?: number;
  clickRate?: number;
}

// ============= API Responses =============

export interface NotificationListResponse {
  notifications: Notification[];
}

export interface NotificationTemplateListResponse {
  templates: NotificationTemplate[];
}

// ============= Request Types =============

export interface CreateNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  targetCriteria?: NotificationTargetCriteria;
  publish_at?: string;
}

export interface ScheduleNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  targetCriteria: NotificationTargetCriteria;
  publish_at: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  body?: string;
  type?: NotificationType;
  category?: string;
  publish_at?: string;
}

export interface CreateFromTemplateRequest {
  template_id: string;
  variables: Record<string, string>;
  category?: string;
  type?: NotificationType;
  targetCriteria?: NotificationTargetCriteria;
  publish_at?: string;
}

export interface CreateTemplateRequest {
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  variables: string[];
}

// ============= Query Parameters =============

export interface NotificationQueryParams {
  limit?: number;
  offset?: number;
  archived?: boolean;
}
