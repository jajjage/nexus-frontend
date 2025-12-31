import apiClient from "@/lib/api-client";
import { ApiResponse, AuthResponse, User } from "@/types/api.types";
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth.types";

export const authService = {
  // Register new user
  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  // Login user
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data
    );
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    // The backend is responsible for clearing the httpOnly accessToken cookie
    const response = await apiClient.post<ApiResponse>("/auth/logout");
    return response.data;
  },

  // Get current user profile from the backend
  getProfile: async (forceRefresh?: boolean): Promise<User | null> => {
    console.log("[DEBUG] getProfile() called, forceRefresh:", forceRefresh);
    try {
      // Add timestamp to URL if forceRefresh is true to bypass HTTP caching
      const url = forceRefresh
        ? `/user/profile/me?t=${Date.now()}`
        : "/user/profile/me";

      const response = await apiClient.get<ApiResponse<User>>(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("[DEBUG] getProfile() response received:", response.data);
      return response.data.data || null;
    } catch (error: any) {
      console.log("[DEBUG] getProfile() error:", {
        status: error.response?.status,
        message: error.message,
      });
      throw error; // Re-throw so axios interceptor can handle 401
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const response =
      await apiClient.post<ApiResponse<{ accessToken: string }>>(
        "/auth/refresh"
      );
    return response.data;
  },

  // Forgot password - Request reset
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/forgot-password",
      data
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/reset-password",
      data
    );
    return response.data;
  },

  // Update password
  updatePassword: async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/update-password",
      data
    );
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/auth/resend-verification",
      {
        email,
      }
    );
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>(
      `/auth/verify?token=${token}`
    );
    return response.data;
  },
};
