/**
 * Notification Hooks Tests
 * Tests for useAdminNotifications hooks
 */

import {
  useAdminNotifications,
  useCreateFromTemplate,
  useCreateNotification,
  useCreateTemplate,
  useDeleteNotification,
  useDeleteTemplate,
  useNotificationAnalytics,
  useNotificationTemplate,
  useNotificationTemplates,
  useScheduleNotification,
  useUpdateNotification,
} from "@/hooks/admin/useAdminNotifications";
import { adminNotificationService } from "@/services/admin/notification.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service
vi.mock("@/services/admin/notification.service", () => ({
  adminNotificationService: {
    getNotifications: vi.fn(),
    getTemplates: vi.fn(),
    getTemplateById: vi.fn(),
    getNotificationAnalytics: vi.fn(),
    createNotification: vi.fn(),
    scheduleNotification: vi.fn(),
    updateNotification: vi.fn(),
    deleteNotification: vi.fn(),
    createFromTemplate: vi.fn(),
    createTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockService = adminNotificationService as unknown as {
  getNotifications: ReturnType<typeof vi.fn>;
  getTemplates: ReturnType<typeof vi.fn>;
  getTemplateById: ReturnType<typeof vi.fn>;
  getNotificationAnalytics: ReturnType<typeof vi.fn>;
  createNotification: ReturnType<typeof vi.fn>;
  scheduleNotification: ReturnType<typeof vi.fn>;
  updateNotification: ReturnType<typeof vi.fn>;
  deleteNotification: ReturnType<typeof vi.fn>;
  createFromTemplate: ReturnType<typeof vi.fn>;
  createTemplate: ReturnType<typeof vi.fn>;
  deleteTemplate: ReturnType<typeof vi.fn>;
};

describe("Notification Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockNotification = {
    id: "notif-123",
    title: "Test Notification",
    body: "This is a test",
    type: "info" as const,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockTemplate = {
    id: "tmpl-123",
    name: "test_template",
    title: "Test {{var}}",
    body: "Test body {{var}}",
    type: "info" as const,
    variables: ["var"],
  };

  const mockAnalytics = {
    notificationId: "notif-123",
    totalSent: 1000,
    totalDelivered: 950,
    readRate: 50,
  };

  // ============= useAdminNotifications Tests =============

  describe("useAdminNotifications", () => {
    it("should fetch notifications list", async () => {
      const mockResponse = {
        success: true,
        data: { notifications: [mockNotification] },
      };

      mockService.getNotifications.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminNotifications(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data?.notifications).toHaveLength(1);
    });
  });

  // ============= useNotificationTemplates Tests =============

  describe("useNotificationTemplates", () => {
    it("should fetch templates list", async () => {
      const mockResponse = {
        success: true,
        data: [mockTemplate],
      };

      mockService.getTemplates.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNotificationTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toHaveLength(1);
    });
  });

  // ============= useNotificationAnalytics Tests =============

  describe("useNotificationAnalytics", () => {
    it("should fetch notification analytics", async () => {
      const mockResponse = {
        success: true,
        data: mockAnalytics,
      };

      mockService.getNotificationAnalytics.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useNotificationAnalytics("notif-123"),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockAnalytics);
    });
  });

  // ============= useNotificationTemplate Tests =============

  describe("useNotificationTemplate", () => {
    it("should fetch template by ID", async () => {
      const mockResponse = {
        success: true,
        data: mockTemplate,
      };

      mockService.getTemplateById.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNotificationTemplate("tmpl-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockTemplate);
    });
  });

  // ============= useCreateNotification Tests =============

  describe("useCreateNotification", () => {
    it("should create notification successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Notification created",
        data: { notification: mockNotification },
      };

      mockService.createNotification.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateNotification(), { wrapper });

      result.current.mutate({
        title: "Test Notification",
        body: "This is a test",
        type: "info",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createNotification).toHaveBeenCalledWith({
        title: "Test Notification",
        body: "This is a test",
        type: "info",
      });
    });
  });

  // ============= useScheduleNotification Tests =============

  describe("useScheduleNotification", () => {
    it("should schedule notification successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Notification scheduled",
        data: mockNotification,
      };

      mockService.scheduleNotification.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useScheduleNotification(), {
        wrapper,
      });

      result.current.mutate({
        title: "Scheduled",
        body: "This is scheduled",
        type: "info",
        targetCriteria: { minTransactionCount: 5 },
        publish_at: "2024-02-01T10:00:00Z",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.scheduleNotification).toHaveBeenCalled();
    });
  });

  // ============= useUpdateNotification Tests =============

  describe("useUpdateNotification", () => {
    it("should update notification successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Notification updated",
        data: { notification: { ...mockNotification, title: "Updated" } },
      };

      mockService.updateNotification.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateNotification(), { wrapper });

      result.current.mutate({
        notificationId: "notif-123",
        data: { title: "Updated" },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.updateNotification).toHaveBeenCalledWith("notif-123", {
        title: "Updated",
      });
    });
  });

  // ============= useDeleteNotification Tests =============

  describe("useDeleteNotification", () => {
    it("should delete notification successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Notification deleted",
      };

      mockService.deleteNotification.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper,
      });

      result.current.mutate("notif-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.deleteNotification).toHaveBeenCalledWith("notif-123");
    });
  });

  // ============= useCreateFromTemplate Tests =============

  describe("useCreateFromTemplate", () => {
    it("should create from template successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Notification created from template",
        data: { notification: mockNotification },
      };

      mockService.createFromTemplate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateFromTemplate(), { wrapper });

      result.current.mutate({
        template_id: "tmpl-123",
        variables: { var: "value" },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createFromTemplate).toHaveBeenCalledWith({
        template_id: "tmpl-123",
        variables: { var: "value" },
      });
    });
  });

  // ============= useCreateTemplate Tests =============

  describe("useCreateTemplate", () => {
    it("should create template successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Template created",
        data: { template: mockTemplate },
      };

      mockService.createTemplate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateTemplate(), { wrapper });

      result.current.mutate({
        name: "test_template",
        title: "Test {{var}}",
        body: "Test body {{var}}",
        type: "info",
        variables: ["var"],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createTemplate).toHaveBeenCalledWith({
        name: "test_template",
        title: "Test {{var}}",
        body: "Test body {{var}}",
        type: "info",
        variables: ["var"],
      });
    });
  });

  // ============= useDeleteTemplate Tests =============

  describe("useDeleteTemplate", () => {
    it("should delete template successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Template deleted",
      };

      mockService.deleteTemplate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteTemplate(), { wrapper });

      result.current.mutate("tmpl-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.deleteTemplate).toHaveBeenCalledWith("tmpl-123");
    });
  });
});
