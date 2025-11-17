import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { User } from "@/types/api.types";
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth.types";
import { AxiosError } from "axios";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  hasRole,
  isSuspended,
  isVerified,
} from "@/lib/auth-utils";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
  });
};

// Custom hook for authorization checks
export const useAuth = () => {
  const { data: user, isLoading, isError } = useCurrentUser();

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
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      const role = data.data?.user?.role;
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

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      const role = data.data?.user?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: AxiosError<any>) => {
      console.error("Login failed. Full error object:", error);
    },
  });
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
      // Still clear cookies and redirect
      import("js-cookie").then((Cookies) => {
        Cookies.default.remove("user");
      });
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
