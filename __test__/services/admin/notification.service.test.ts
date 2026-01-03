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
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
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
});
