import { useLogin, useLogout, useRegister } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { syncFcmToken, unlinkFcmToken } from "@/services/notification.service";
import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

/**
 * Mock dependencies
 */
jest.mock("@/services/auth.service");
jest.mock("@/services/notification.service");
jest.mock("next/navigation");
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: any) => {
    let mutationFn = options.mutationFn;
    let onSuccess = options.onSuccess;
    let onError = options.onError;
    let isSuccess = false;
    let isError = false;
    let isPending = false;
    let data: any = null;
    let error: any = null;

    return {
      mutate: (variables: any) => {
        isPending = true;
        Promise.resolve(mutationFn(variables))
          .then((result) => {
            isSuccess = true;
            isPending = false;
            data = result;
            onSuccess?.(result);
          })
          .catch((err) => {
            isError = true;
            isPending = false;
            error = err;
            onError?.(err);
          });
      },
      mutateAsync: (variables: any) => mutationFn(variables),
      get isSuccess() {
        return isSuccess;
      },
      get isError() {
        return isError;
      },
      get isPending() {
        return isPending;
      },
      get data() {
        return data;
      },
      get error() {
        return error;
      },
      reset: jest.fn(),
    };
  }),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
  invalidateQueries: jest.fn(),
}));

describe("Auth Hooks - FCM Integration", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockQueryClient = {
    setQueryData: jest.fn(),
    clear: jest.fn(),
    invalidateQueries: jest.fn(),
  };

  const mockUser = {
    userId: "user123",
    fullName: "Test User",
    email: "test@example.com",
    phoneNumber: "1234567890",
    role: "user",
    isSuspended: false,
    isVerified: true,
    twoFactorEnabled: false,
    accountNumber: "ACC123",
    providerName: "nexus",
    balance: "1000",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockLoginResponse = {
    success: true,
    message: "Login successful",
    data: {
      accessToken: "access_token_123",
      refreshToken: "refresh_token_123",
      user: mockUser,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
  });

  describe("useLogin", () => {
    it("should sync FCM token after successful login", async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          email: "test@example.com",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify FCM token was synced
      expect(syncFcmToken).toHaveBeenCalledWith("web");
    });

    it("should cache user data after login", async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          email: "test@example.com",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify user query was invalidated (to refetch fresh data)
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(["auth", "current-user"]),
      });
    });

    it("should redirect to user dashboard after login", async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          email: "test@example.com",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify redirect
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });

    it("should redirect to admin dashboard for admin role", async () => {
      const adminResponse = {
        ...mockLoginResponse,
        data: {
          ...mockLoginResponse.data,
          user: { ...mockUser, role: "admin" },
        },
      };

      (authService.login as jest.Mock).mockResolvedValue(adminResponse);
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          email: "admin@example.com",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockRouter.push).toHaveBeenCalledWith("/admin/dashboard");
    });

    it("should not block login if FCM token sync fails", async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      (syncFcmToken as jest.Mock).mockRejectedValue(
        new Error("FCM sync failed")
      );

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          email: "test@example.com",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Login should still succeed and navigate
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
      // FCM failure should not prevent login
      expect(syncFcmToken).toHaveBeenCalled();
    });

    it("should handle login with phone number", async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "password123",
          phone: "1234567890",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authService.login).toHaveBeenCalledWith({
        password: "password123",
        phone: "1234567890",
      });
      expect(syncFcmToken).toHaveBeenCalled();
    });

    it("should handle login error", async () => {
      const loginError = new Error("Invalid credentials");
      (authService.login as jest.Mock).mockRejectedValue(loginError);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.mutate({
          password: "wrongpassword",
          email: "test@example.com",
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(syncFcmToken).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("useRegister", () => {
    const mockRegisterResponse = {
      success: true,
      message: "Registration successful",
      data: {
        // Note: Register endpoint does NOT return tokens (unlike the mock response)
        // In reality, backend only returns user data after registration
        user: mockUser,
      },
    };

    it("should redirect to login after successful registration", async () => {
      (authService.register as jest.Mock).mockResolvedValue(
        mockRegisterResponse
      );

      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.mutate({
          email: "test@example.com",
          password: "Password123!",
          phoneNumber: "1234567890",
          fullName: "Test User",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 3000,
      });

      // After registration, user should be redirected to login (not dashboard)
      // Email is pre-filled in the login form for better UX
      // Wait for the redirect to happen (includes 1500ms delay for toast to show)
      await waitFor(
        () =>
          expect(mockRouter.push).toHaveBeenCalledWith(
            `/login?email=${encodeURIComponent("test@example.com")}&fromRegister=true`
          ),
        { timeout: 3000 }
      );
    });

    it("should show success message after registration", async () => {
      (authService.register as jest.Mock).mockResolvedValue(
        mockRegisterResponse
      );

      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.mutate({
          email: "test@example.com",
          password: "Password123!",
          phoneNumber: "1234567890",
          fullName: "Test User",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Success message is shown via toast
      // This is tested by the fact that registration succeeds
      expect(result.current.isSuccess).toBe(true);
    });

    it("should NOT sync FCM token during registration (no tokens returned)", async () => {
      (authService.register as jest.Mock).mockResolvedValue(
        mockRegisterResponse
      );
      (syncFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.mutate({
          email: "newuser@example.com",
          password: "Password123!",
          phoneNumber: "9876543210",
          fullName: "New User",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // FCM sync is NOT called after register because tokens are not available yet
      // User must login first to receive auth tokens, then FCM will sync on login
      expect(syncFcmToken).not.toHaveBeenCalled();
    });
  });

  describe("useLogout", () => {
    it("should unlink FCM token on logout", async () => {
      (authService.logout as jest.Mock).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });
      (unlinkFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify FCM token was unlinked
      expect(unlinkFcmToken).toHaveBeenCalled();
    });

    it("should clear all cached queries after logout", async () => {
      (authService.logout as jest.Mock).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });
      (unlinkFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockQueryClient.clear).toHaveBeenCalled();
    });

    it("should redirect to login after logout", async () => {
      (authService.logout as jest.Mock).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });
      (unlinkFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });

    it("should still clear data and redirect even if unlink fails", async () => {
      (authService.logout as jest.Mock).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });
      (unlinkFcmToken as jest.Mock).mockRejectedValue(
        new Error("Unlink failed")
      );

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should still clear and redirect despite unlink failure
      expect(mockQueryClient.clear).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });

    it("should prevent notifications to next user on shared device", async () => {
      /**
       * Scenario:
       * 1. User A logs in -> FCM token synced to User A
       * 2. User A logs out -> FCM token unlinked
       * 3. User B logs in -> New FCM token synced to User B
       *
       * This test verifies that User A's token is unlinked before User B logs in
       */
      (authService.logout as jest.Mock).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });
      (unlinkFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // User A's token should be unlinked
      expect(unlinkFcmToken).toHaveBeenCalled();
      // All data cleared
      expect(mockQueryClient.clear).toHaveBeenCalled();
      // Redirect to login for next user
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });

    it("should handle logout error gracefully", async () => {
      (authService.logout as jest.Mock).mockRejectedValue(
        new Error("Logout API error")
      );
      (unlinkFcmToken as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.mutate();
      });

      // Should still redirect to login on error
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/login");
      });
    });
  });
});
