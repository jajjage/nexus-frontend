import {
  useAuditLogs,
  useExportAuditLogs,
  useUserActions,
  useUserActivity,
} from "@/hooks/admin/useAdminAudit";
import { adminAuditService } from "@/services/admin/audit.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock the service
vi.mock("@/services/admin/audit.service");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockAdminAuditService = adminAuditService as {
  getAuditLogs: Mock;
  exportAuditLogs: Mock;
  getUserActions: Mock;
  getUserActivity: Mock;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAdminAudit hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAuditLogs", () => {
    it("should fetch audit logs successfully", async () => {
      const mockData = {
        data: {
          entries: [
            { id: "1", action_type: "credit_wallet", admin_id: "admin-1" },
          ],
          pagination: { total: 1, page: 1, limit: 50, pages: 1 },
        },
      };

      mockAdminAuditService.getAuditLogs.mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useAuditLogs({ page: 1, limit: 50 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.entries).toHaveLength(1);
      expect(result.current.data?.entries[0].action_type).toBe("credit_wallet");
    });

    it("should handle empty params", async () => {
      mockAdminAuditService.getAuditLogs.mockResolvedValueOnce({
        data: { entries: [], pagination: {} },
      });

      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAdminAuditService.getAuditLogs).toHaveBeenCalledWith({});
    });
  });

  describe("useUserActions", () => {
    it("should fetch user actions when userId provided", async () => {
      const mockData = {
        data: {
          userId: "user-123",
          entries: [{ id: "1", action_type: "suspend_user" }],
        },
      };

      mockAdminAuditService.getUserActions.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useUserActions("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.userId).toBe("user-123");
    });

    it("should not fetch when userId is empty", async () => {
      const { result } = renderHook(() => useUserActions(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockAdminAuditService.getUserActions).not.toHaveBeenCalled();
    });
  });

  describe("useUserActivity", () => {
    it("should fetch user activity with params", async () => {
      const mockData = {
        data: {
          entries: [{ id: "1", user_id: "user-123", action_type: "login" }],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 },
        },
      };

      mockAdminAuditService.getUserActivity.mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useUserActivity("user-123", { page: 1, actionType: "login" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.entries[0].action_type).toBe("login");
      expect(mockAdminAuditService.getUserActivity).toHaveBeenCalledWith(
        "user-123",
        { page: 1, actionType: "login" }
      );
    });
  });

  describe("useExportAuditLogs", () => {
    it.skip("should export audit logs and trigger download", async () => {
      const mockBlob = new Blob(["test"], { type: "application/json" });
      mockAdminAuditService.exportAuditLogs.mockResolvedValueOnce(mockBlob);

      // Mock DOM APIs
      const createObjectURLMock = vi.fn(() => "blob:test");
      const revokeObjectURLMock = vi.fn();
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const clickMock = vi.fn();

      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const mockLink = {
        href: "",
        setAttribute: vi.fn(),
        click: clickMock,
        remove: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(
        appendChildMock
      );

      const { result } = renderHook(() => useExportAuditLogs(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ fromDate: "2026-01-01" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAdminAuditService.exportAuditLogs).toHaveBeenCalledWith({
        fromDate: "2026-01-01",
      });
      expect(clickMock).toHaveBeenCalled();
    });
  });
});
