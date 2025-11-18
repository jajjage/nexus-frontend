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
  getProfile: async (): Promise<User | null> => {
    try {
      const response =
        await apiClient.get<ApiResponse<User>>("/user/profile/me");
      console.log("Fetched user profile:", response.data);
      return response.data.data || null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
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
};
