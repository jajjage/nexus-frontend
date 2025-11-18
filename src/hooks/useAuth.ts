import {
  Permission,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasRole,
  isAdmin,
  isSuspended,
  isVerified,
} from "@/lib/auth-utils";
import { authService } from "@/services/auth.service";
import { registerFcmToken } from "@/services/notification.service";
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// Get user profile via API
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Retry once on failure
  });
};

// Custom hook for authorization checks
export const useAuth = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();

  // Handle the case where user is undefined (still loading)
  const safeUser = user || null;

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(safeUser, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(safeUser, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return hasAllPermissions(safeUser, permissions);
  };

  const checkRole = (role: string): boolean => {
    return hasRole(safeUser, role);
  };

  return {
    user: safeUser,
    isLoading,
    isError,
    refetch, // Include the refetch function to allow manual refresh
    isAuthenticated: !!safeUser && !isSuspended(safeUser),
    isAdmin: isAdmin(safeUser),
    isSuspended: isSuspended(safeUser),
    isVerified: isVerified(safeUser),
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
  };
};

// Register mutation
export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      const user = data.data?.user;
      if (user) {
        // Manually set the user data in the cache for immediate access
        queryClient.setQueryData(authKeys.currentUser(), user);
      } else {
        // Fallback to invalidation if user data is not in the response
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      }

      const role = user?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: AxiosError<any>) => {
      console.error("Registration failed:", error.response?.data?.message);
    },
  });
};

// Login mutation
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutationOptions = {
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (data: any) => {
      const user = data.data?.user;
      if (user) {
        queryClient.setQueryData(authKeys.currentUser(), user);
      } else {
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      }
      console.log("Login successful:", data);
      // Fire-and-forget: Register FCM token in background
      // Don't await or block login - if it fails, it's not critical
      registerFcmToken("web").catch((err) => {
        console.warn("FCM token registration failed (non-blocking):", err);
      });

      const role = user?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: AxiosError<any>) => {
      console.error("Login failed. Full error object:", error);
    },
  };

  return useMutation(mutationOptions);
};

// Logout mutation
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear(); // Clear all queries
      router.push("/login");
    },
    onError: (error: AxiosError<any>) => {
      console.error("Logout failed:", error.response?.data?.message);
      // If logout fails on the backend, still push to login as the token is likely invalid
      router.push("/login");
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      authService.forgotPassword(data),
    onSuccess: (data) => {
      console.log("Password reset email sent:", data.message);
    },
    onError: (error: AxiosError<any>) => {
      console.error("Forgot password failed:", error.response?.data?.message);
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
    onSuccess: (data) => {
      console.log("Password reset successful:", data.message);
      router.push("/login");
    },
    onError: (error: AxiosError<any>) => {
      console.error("Reset password failed:", error.response?.data?.message);
    },
  });
};

// Update password mutation
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: UpdatePasswordRequest) =>
      authService.updatePassword(data),
    onSuccess: (data) => {
      console.log("Password updated successfully:", data.message);
    },
    onError: (error: AxiosError<any>) => {
      console.error("Update password failed:", error.response?.data?.message);
    },
  });
};
