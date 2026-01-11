import {
  useAdminUser,
  useAdminUsers,
  useVerifyUser,
} from "@/hooks/admin/useAdminUsers";
import { adminUserService } from "@/services/admin/user.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/user.service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminUserService = adminUserService as Mocked<
  typeof adminUserService
>;

describe("Admin User Hooks", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminUsers", () => {
    const mockUsersResponse = {
      success: true,
      message: "Users fetched",
      data: {
        users: [
          {
            id: "user-1",
            userId: "user-1",
            fullName: "Test User 1",
            email: "test1@example.com",
            phoneNumber: "1234567890",
            role: "user",
            isVerified: true,
            isSuspended: false,
            balance: "100",
          },
          {
            id: "user-2",
            userId: "user-2",
            fullName: "Test User 2",
            email: "test2@example.com",
            phoneNumber: "0987654321",
            role: "admin",
            isVerified: true,
            isSuspended: true,
            balance: "500",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    };

    it("should fetch users list successfully", async () => {
      mockAdminUserService.getUsers.mockResolvedValue(mockUsersResponse);

      const { result } = renderHook(
        () => useAdminUsers({ page: 1, limit: 10 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUsersResponse);
      expect(mockAdminUserService.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle fetch error", async () => {
      mockAdminUserService.getUsers.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAdminUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAdminUser", () => {
    const mockUserResponse = {
      success: true,
      message: "User fetched",
      data: {
        id: "user-123",
        userId: "user-123",
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "1234567890",
        role: "user",
        isVerified: true,
        isSuspended: false,
        balance: "250",
      },
    };

    it("should fetch single user by ID", async () => {
      mockAdminUserService.getUserById.mockResolvedValue(mockUserResponse);

      const { result } = renderHook(() => useAdminUser("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUserResponse);
      expect(mockAdminUserService.getUserById).toHaveBeenCalledWith("user-123");
    });

    it("should not fetch when userId is empty", async () => {
      const { result } = renderHook(() => useAdminUser(""), {
        wrapper: createWrapper(),
      });

      // Should stay in idle state since query is disabled
      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockAdminUserService.getUserById).not.toHaveBeenCalled();
    });
  });

  describe("useVerifyUser", () => {
    it("should verify user successfully", async () => {
      const mockResponse = {
        success: true,
        message: "User verified successfully",
      };
      mockAdminUserService.verifyUser.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useVerifyUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate("user-123");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockAdminUserService.verifyUser).toHaveBeenCalledWith("user-123");
    });

    it("should handle verify error", async () => {
      const mockError = {
        response: {
          data: {
            message: "User not found",
          },
        },
      };
      mockAdminUserService.verifyUser.mockRejectedValue(mockError);

      const { result } = renderHook(() => useVerifyUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate("invalid-user");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(mockAdminUserService.verifyUser).toHaveBeenCalledWith(
        "invalid-user"
      );
    });
  });
});
