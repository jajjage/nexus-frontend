import { renderHook, waitFor } from "@testing-library/react";
import { useAuth, useLogin, useLogout } from "@/hooks/useAuth";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock authService
vi.mock("@/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    register: vi.fn(),
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
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as vi.Mock).mockReturnValue(mockRouter);

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe("useLogin", () => {
    it("should login successfully and redirect", async () => {
      // Setup mock return
      const mockUser = { userId: "123", role: "user" };
      (authService.login as vi.Mock).mockResolvedValue({
        data: { user: mockUser },
      });
      // getProfile needs to succeed because login invalidates it
      (authService.getProfile as vi.Mock).mockResolvedValue(mockUser);

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
      (window.localStorage.getItem as vi.Mock).mockReturnValue(
        JSON.stringify({ userId: "123" })
      );
      (authService.getProfile as vi.Mock).mockResolvedValue({
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
