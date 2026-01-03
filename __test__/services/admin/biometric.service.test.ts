/**
 * Biometric Service Tests
 * Tests for adminBiometricService methods
 */

import apiClient from "@/lib/api-client";
import { adminBiometricService } from "@/services/admin/biometric.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("adminBiometricService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats = {
    hoursBack: 24,
    period_start: "2024-01-01T00:00:00Z",
    period_end: "2024-01-02T00:00:00Z",
    totalEnrollments: 500,
    totalVerifications: 1200,
    successfulVerifications: 1100,
    failedVerifications: 100,
    successRate: 91.67,
  };

  const mockActiveEnrollment = {
    id: "enroll-1",
    user_id: "user-123",
    device_name: "iPhone",
    platform: "ios",
    browser: null,
    authenticator_attachment: "platform",
    user_verified: true,
    is_active: true,
    last_used_at: null,
    usage_count: 0,
    enrolled_at: "2024-01-01T00:00:00Z",
    enrollment_ip_address: null,
    enrollment_user_agent: null,
    revoked_at: null,
    revoked_reason: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_email: "test@example.com",
    user_full_name: "Test User",
  };

  const mockActiveListResponse = {
    enrollments: [mockActiveEnrollment],
    pagination: {
      total: 1,
      limit: 50,
      offset: 0,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  const mockAuditLog = {
    userId: "user-123",
    logs: [
      {
        id: "log-1",
        userId: "user-123",
        action: "verification",
        status: "success",
        ipAddress: "192.168.1.1",
        createdAt: "2024-01-01T12:00:00Z",
      },
    ],
    count: 1,
  };

  const mockEnrollments = {
    userId: "user-123",
    enrollments: [
      {
        id: "enroll-1",
        userId: "user-123",
        type: "fingerprint",
        deviceName: "iPhone 15",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
    count: 1,
    active_count: 1,
  };

  // ============= getStats Tests =============

  describe("getStats", () => {
    it("should fetch biometric stats", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Stats retrieved",
          data: mockStats,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.getStats();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/biometric/stats", {
        params: undefined,
      });
      expect(result.data).toEqual(mockStats);
    });

    it("should pass hoursBack param", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockStats,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await adminBiometricService.getStats({ hoursBack: 48 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/biometric/stats", {
        params: { hoursBack: 48 },
      });
    });
  });

  // ============= getActiveList Tests =============

  describe("getActiveList", () => {
    it("should fetch active enrollments list", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Active enrollments retrieved",
          data: mockActiveListResponse,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.getActiveList();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/biometric/active-list",
        { params: undefined }
      );
      expect(result.data?.enrollments).toHaveLength(1);
      expect(result.data?.pagination.total).toBe(1);
    });

    it("should pass pagination params", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockActiveListResponse,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await adminBiometricService.getActiveList({ limit: 20, offset: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/biometric/active-list",
        { params: { limit: 20, offset: 10 } }
      );
    });
  });

  // ============= getAuditLog Tests =============

  describe("getAuditLog", () => {
    it("should fetch audit log for user", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Audit logs retrieved",
          data: mockAuditLog,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.getAuditLog("user-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/biometric/audit-log/user-123",
        { params: undefined }
      );
      expect(result.data).toEqual(mockAuditLog);
    });
  });

  // ============= getEnrollments Tests =============

  describe("getEnrollments", () => {
    it("should fetch enrollments for user", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Enrollments retrieved",
          data: mockEnrollments,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.getEnrollments("user-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/biometric/enrollments/user-123"
      );
      expect(result.data).toEqual(mockEnrollments);
    });
  });

  // ============= revokeEnrollment Tests =============

  describe("revokeEnrollment", () => {
    it("should revoke a specific enrollment", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Enrollment revoked",
          data: {
            id: "enroll-1",
            revoked: true,
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.revokeEnrollment("enroll-1");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/biometric/revoke/enroll-1",
        { reason: undefined }
      );
      expect(result.data?.revoked).toBe(true);
    });
  });

  // ============= revokeAll Tests =============

  describe("revokeAll", () => {
    it("should revoke all enrollments for user", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Revoked 3 biometric enrollments",
          data: {
            userId: "user-123",
            revokedCount: 3,
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await adminBiometricService.revokeAll("user-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/biometric/revoke-all",
        { userId: "user-123" }
      );
      expect(result.data?.revokedCount).toBe(3);
    });
  });
});
