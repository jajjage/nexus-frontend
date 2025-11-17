import apiClient from "@/lib/api-client";
import { ApiResponse, AuthResponse, User } from "@/types/api.types";
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth.types";

import Cookies from "js-cookie";

export const authService = {
  // Register new user
  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      JSON.stringify(data)
    );

    // Store user data in cookie (tokens are httpOnly cookies set by backend)
    if (response.data.success && response.data.data) {
      Cookies.set("user", JSON.stringify(response.data.data.user), {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return response.data;
  },

  // Login user
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      JSON.stringify(data)
    );

    // Store user data in cookie (tokens are httpOnly cookies set by backend)
    if (response.data.success && response.data.data) {
      Cookies.set("user", JSON.stringify(response.data.data.user), {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>("/auth/logout");

    // Clear user cookie (backend will clear httpOnly token cookies)
    Cookies.remove("user");

    return response.data;
  },

  // Refresh access token
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    // Cookies are sent automatically with withCredentials: true
    const response =
      await apiClient.post<ApiResponse<{ accessToken: string }>>(
        "/auth/refresh"
      );

    // Backend will set new access token cookie
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
      JSON.stringify(data)
    );
    return response.data;
  },

  // Update password
  updatePassword: async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/update-password",
      JSON.stringify(data)
    );
    return response.data;
  },

  // Get current user from cookie
  getCurrentUser: (): User | null => {
    const userStr = Cookies.get("user");
    if (!userStr || userStr === "undefined") {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!Cookies.get("user");
  },
};
