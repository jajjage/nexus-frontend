/**
 * Biometric Hooks Tests
 * Tests for useAdminBiometric hooks
 */

import {
  useActiveEnrollments,
  useBiometricAuditLog,
  useBiometricEnrollments,
  useBiometricStats,
  useRevokeAllBiometrics,
  useRevokeEnrollment,
} from "@/hooks/admin/useAdminBiometric";
import { adminBiometricService } from "@/services/admin/biometric.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service
vi.mock("@/services/admin/biometric.service", () => ({
  adminBiometricService: {
    getStats: vi.fn(),
    getActiveList: vi.fn(),
    getAuditLog: vi.fn(),
    getEnrollments: vi.fn(),
    revokeEnrollment: vi.fn(),
    revokeAll: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockService = adminBiometricService as unknown as {
  getStats: ReturnType<typeof vi.fn>;
  getActiveList: ReturnType<typeof vi.fn>;
  getAuditLog: ReturnType<typeof vi.fn>;
  getEnrollments: ReturnType<typeof vi.fn>;
  revokeEnrollment: ReturnType<typeof vi.fn>;
  revokeAll: ReturnType<typeof vi.fn>;
};

describe("Biometric Hooks", () => {
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

  const mockStats = {
    hoursBack: 24,
    period_start: "2024-01-01T00:00:00Z",
    period_end: "2024-01-02T00:00:00Z",
    totalEnrollments: 500,
  };

  const mockActiveList = {
    enrollments: [
      {
        id: "enroll-1",
        user_id: "user-123",
        device_name: "iPhone",
        is_active: true,
        user_email: "test@example.com",
        user_full_name: "Test User",
      },
    ],
    pagination: { total: 1, page: 1, totalPages: 1 },
  };

  const mockAuditLog = {
    userId: "user-123",
    logs: [{ id: "log-1", action: "verify", status: "success" }],
    count: 1,
  };

  const mockEnrollments = {
    userId: "user-123",
    enrollments: [{ id: "enroll-1", type: "fingerprint", isActive: true }],
    count: 1,
    active_count: 1,
  };

  // ============= useBiometricStats Tests =============

  describe("useBiometricStats", () => {
    it("should fetch biometric stats", async () => {
      const mockResponse = {
        success: true,
        data: mockStats,
      };

      mockService.getStats.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBiometricStats(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockStats);
    });
  });

  // ============= useActiveEnrollments Tests =============

  describe("useActiveEnrollments", () => {
    it("should fetch active enrollments list", async () => {
      const mockResponse = {
        success: true,
        data: mockActiveList,
      };

      mockService.getActiveList.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useActiveEnrollments(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data?.enrollments).toHaveLength(1);
    });
  });

  // ============= useBiometricAuditLog Tests =============

  describe("useBiometricAuditLog", () => {
    it("should fetch audit log for user", async () => {
      const mockResponse = {
        success: true,
        data: mockAuditLog,
      };

      mockService.getAuditLog.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBiometricAuditLog("user-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockAuditLog);
    });

    it("should not fetch if userId is empty", async () => {
      const { result } = renderHook(() => useBiometricAuditLog(""), {
        wrapper,
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockService.getAuditLog).not.toHaveBeenCalled();
    });
  });

  // ============= useBiometricEnrollments Tests =============

  describe("useBiometricEnrollments", () => {
    it("should fetch enrollments for user", async () => {
      const mockResponse = {
        success: true,
        data: mockEnrollments,
      };

      mockService.getEnrollments.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBiometricEnrollments("user-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockEnrollments);
    });
  });

  // ============= useRevokeEnrollment Tests =============

  describe("useRevokeEnrollment", () => {
    it("should revoke a specific enrollment", async () => {
      const mockResponse = {
        success: true,
        message: "Enrollment revoked",
        data: { id: "enroll-1", revoked: true },
      };

      mockService.revokeEnrollment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevokeEnrollment(), { wrapper });

      result.current.mutate({ enrollmentId: "enroll-1" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.revokeEnrollment).toHaveBeenCalledWith(
        "enroll-1",
        undefined
      );
    });
  });

  // ============= useRevokeAllBiometrics Tests =============

  describe("useRevokeAllBiometrics", () => {
    it("should revoke all biometrics for user", async () => {
      const mockResponse = {
        success: true,
        message: "Revoked 3 enrollments",
        data: {
          userId: "user-123",
          revokedCount: 3,
        },
      };

      mockService.revokeAll.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevokeAllBiometrics(), {
        wrapper,
      });

      result.current.mutate("user-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.revokeAll).toHaveBeenCalledWith("user-123");
      expect(result.current.data?.data?.revokedCount).toBe(3);
    });
  });
});
