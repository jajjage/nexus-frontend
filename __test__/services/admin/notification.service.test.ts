/**
 * Notification Service Tests
 * Tests for adminNotificationService methods
 */

import apiClient from "@/lib/api-client";
import { adminNotificationService } from "@/services/admin/notification.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("adminNotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNotification = {
    id: "notif-123",
    title: "System Update",
    body: "The system will be down for maintenance",
    type: "warning" as const,
    category: "system",
    publish_at: "2024-01-15T10:00:00Z",
    archived: false,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockTemplate = {
    id: "tmpl-123",
    name: "welcome_user",
    title: "Welcome {{name}}!",
    body: "Welcome to our platform, {{name}}!",
    type: "info" as const,
    category: "onboarding",
    variables: ["name"],
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockAnalytics = {
    notificationId: "notif-123",
    totalSent: 1000,
    totalDelivered: 950,
    totalRead: 500,
    deliveryRate: 95,
    readRate: 50,
  };

  // ============= getNotifications Tests =============

  describe("getNotifications", () => {
    it("should fetch all notifications", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Notifications retrieved",
          data: { notifications: [mockNotification] },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.getNotifications();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/notifications", {
        params: undefined,
      });
      expect(result.data!.notifications).toHaveLength(1);
    });

    it("should pass query params for filtering", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { notifications: [] },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await adminNotificationService.getNotifications({
        archived: true,
        limit: 20,
        offset: 10,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/notifications", {
        params: { archived: true, limit: 20, offset: 10 },
      });
    });
  });

  // ============= createNotification Tests =============

  describe("createNotification", () => {
    it("should create a notification", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Notification created",
          data: { notification: mockNotification },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.createNotification({
        title: "System Update",
        body: "The system will be down for maintenance",
        type: "warning",
        category: "system",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/admin/notifications", {
        title: "System Update",
        body: "The system will be down for maintenance",
        type: "warning",
        category: "system",
      });
      expect(result.data!.notification).toEqual(mockNotification);
    });
  });

  // ============= scheduleNotification Tests =============

  describe("scheduleNotification", () => {
    it("should schedule a notification with target criteria", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Notification scheduled",
          data: mockNotification,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const scheduleData = {
        title: "Scheduled Notification",
        body: "This is scheduled",
        type: "info" as const,
        targetCriteria: {
          minTransactionCount: 5,
          lastActiveWithinDays: 30,
        },
        publish_at: "2024-02-01T10:00:00Z",
      };

      const result =
        await adminNotificationService.scheduleNotification(scheduleData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/notifications/schedule",
        scheduleData
      );
      expect(result.data).toEqual(mockNotification);
    });
  });

  // ============= updateNotification Tests =============

  describe("updateNotification", () => {
    it("should update a notification", async () => {
      const updatedNotification = {
        ...mockNotification,
        title: "Updated Title",
      };
      const mockResponse = {
        data: {
          success: true,
          message: "Notification updated",
          data: { notification: updatedNotification },
        },
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.updateNotification(
        "notif-123",
        { title: "Updated Title" }
      );

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        "/admin/notifications/notif-123",
        { title: "Updated Title" }
      );
      expect(result.data!.notification.title).toBe("Updated Title");
    });
  });

  // ============= deleteNotification Tests =============

  describe("deleteNotification", () => {
    it("should delete a notification", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Notification deleted",
        },
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await adminNotificationService.deleteNotification("notif-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/notifications/notif-123"
      );
    });
  });

  // ============= getNotificationAnalytics Tests =============

  describe("getNotificationAnalytics", () => {
    it("should fetch notification analytics", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Analytics retrieved",
          data: mockAnalytics,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result =
        await adminNotificationService.getNotificationAnalytics("notif-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/analytics"
      );
      expect(result.data).toEqual(mockAnalytics);
    });
  });

  // ============= createFromTemplate Tests =============

  describe("createFromTemplate", () => {
    it("should create notification from template", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Notification created from template",
          data: {
            notification: { ...mockNotification, title: "Welcome John!" },
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.createFromTemplate({
        template_id: "tmpl-123",
        variables: { name: "John" },
        type: "info",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/notifications/from-template",
        {
          template_id: "tmpl-123",
          variables: { name: "John" },
          type: "info",
        }
      );
      expect(result.data!.notification.title).toBe("Welcome John!");
    });
  });

  // ============= getTemplates Tests =============

  describe("getTemplates", () => {
    it("should fetch all templates", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Templates retrieved",
          data: [mockTemplate],
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.getTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/notifications/templates"
      );
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe("welcome_user");
    });
  });

  // ============= getTemplateById Tests =============

  describe("getTemplateById", () => {
    it("should fetch template by ID", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Template retrieved",
          data: mockTemplate,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.getTemplateById("tmpl-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/notifications/templates/tmpl-123"
      );
      expect(result.data).toEqual(mockTemplate);
    });
  });

  // ============= createTemplate Tests =============

  describe("createTemplate", () => {
    it("should create a template", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Template created",
          data: { template: mockTemplate },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.createTemplate({
        name: "welcome_user",
        title: "Welcome {{name}}!",
        body: "Welcome to our platform, {{name}}!",
        type: "info",
        variables: ["name"],
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/notifications/templates",
        {
          name: "welcome_user",
          title: "Welcome {{name}}!",
          body: "Welcome to our platform, {{name}}!",
          type: "info",
          variables: ["name"],
        }
      );
      expect(result.data!.template).toEqual(mockTemplate);
    });
  });

  // ============= deleteTemplate Tests =============

  describe("deleteTemplate", () => {
    it("should delete a template", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Template deleted",
        },
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await adminNotificationService.deleteTemplate("tmpl-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/notifications/templates/tmpl-123"
      );
    });
  });

  // ============= resendNotification Tests =============

  describe("resendNotification", () => {
    it("should resend immediately when publish_at is not provided", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Resend queued",
          data: {
            notification: mockNotification,
            dispatch: {
              id: "dispatch-1",
              notification_id: "notif-123",
              trigger: "resend",
              status: "queued",
              attempts: 0,
              max_attempts: 3,
              scheduled_for: null,
              sent_at: null,
              last_error: null,
              created_at: "2024-01-02T00:00:00Z",
            },
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.resendNotification(
        "notif-123"
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/resend",
        {}
      );
      expect(result.data?.dispatch.notificationId).toBe("notif-123");
      expect(result.data?.dispatch.maxAttempts).toBe(3);
    });

    it("should resend with publish_at when provided", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Resend scheduled",
          data: {
            notification: mockNotification,
            dispatch: {
              id: "dispatch-2",
              notification_id: "notif-123",
              trigger: "resend",
              status: "queued",
              attempts: 0,
              max_attempts: 3,
              scheduled_for: "2024-01-10T08:00:00Z",
              sent_at: null,
              last_error: null,
              created_at: "2024-01-02T00:00:00Z",
            },
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      await adminNotificationService.resendNotification("notif-123", {
        publish_at: "2024-01-10T08:00:00.000Z",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/resend",
        { publish_at: "2024-01-10T08:00:00.000Z" }
      );
    });
  });

  // ============= getNotificationDispatches Tests =============

  describe("getNotificationDispatches", () => {
    it("should fetch dispatches with params and normalize fields", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            dispatches: [
              {
                id: "dispatch-1",
                notification_id: "notif-123",
                trigger: "initial",
                status: "sent",
                attempts: 1,
                max_attempts: 3,
                scheduled_for: "2024-01-01T10:00:00Z",
                sent_at: "2024-01-01T10:00:02Z",
                last_error: null,
                created_at: "2024-01-01T09:59:59Z",
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
            has_more: false,
          },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.getNotificationDispatches(
        "notif-123",
        { limit: 50, offset: 0 }
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/dispatches",
        { params: { limit: 50, offset: 0 } }
      );
      expect(result.data?.dispatches[0].notificationId).toBe("notif-123");
      expect(result.data?.dispatches[0].maxAttempts).toBe(3);
      expect(result.data?.hasMore).toBe(false);
    });
  });

  // ============= recurrence Tests =============

  describe("recurrence", () => {
    it("should fetch and normalize recurrence", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: "rec-1",
            notification_id: "notif-123",
            time_of_day: "08:00",
            timezone: "Africa/Lagos",
            is_active: true,
            last_run_at: null,
          },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result =
        await adminNotificationService.getNotificationRecurrence("notif-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/recurrence"
      );
      expect(result.data?.timeOfDay).toBe("08:00");
      expect(result.data?.isActive).toBe(true);
    });

    it("should upsert recurrence", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Saved",
          data: {
            id: "rec-1",
            notification_id: "notif-123",
            time_of_day: "09:30",
            timezone: "UTC",
            is_active: false,
            last_run_at: "2024-01-01T08:00:00Z",
          },
        },
      };
      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await adminNotificationService.upsertNotificationRecurrence(
        "notif-123",
        {
          enabled: false,
          time_of_day: "09:30",
          timezone: "UTC",
        }
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/notifications/notif-123/recurrence",
        {
          enabled: false,
          time_of_day: "09:30",
          timezone: "UTC",
        }
      );
      expect(result.data?.timeOfDay).toBe("09:30");
      expect(result.data?.lastRunAt).toBe("2024-01-01T08:00:00Z");
    });
  });
});
