import { renderHook, waitFor } from "@testing-library/react";
import { useAuth, useLogin, useLogout } from "@/hooks/useAuth";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock authService
jest.mock("@/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    register: jest.fn(),
  },
}));

// Setup wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe("useAuth Hooks", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe("useLogin", () => {
    it("should login successfully and redirect", async () => {
      // Setup mock return
      const mockUser = { userId: "123", role: "user" };
      (authService.login as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });
      // getProfile needs to succeed because login invalidates it
      (authService.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: "test@example.com",
        password: "password",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast.success).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("useAuth (Main Hook)", () => {
    it("should return isAuthenticated=false when no user", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should fetch user if localStorage has cache", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ userId: "123" })
      );
      (authService.getProfile as jest.Mock).mockResolvedValue({
        userId: "123",
        role: "user",
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() =>
        expect(result.current.user).toEqual({ userId: "123", role: "user" })
      );
    });
  });
});
