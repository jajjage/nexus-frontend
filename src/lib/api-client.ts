import { ApiResponse, ErrorResponse } from "@/types/api.types";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

// Function to get a cookie by name
const getCookie = (name: string): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return undefined;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  withCredentials: true, // Important! Sends cookies automatically
});

// Request interceptor to add access token to headers
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getCookie("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    console.log("[DEBUG] Response interceptor - error status:", {
      status: error.response?.status,
      url: originalRequest.url,
      hasRetry: originalRequest._retry,
    });

    // List of endpoints that should NOT trigger token refresh
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/password/forgot-password",
      "/password/reset-password",
    ];
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // If error is 401, not an auth endpoint, and we haven't tried to refresh yet
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      console.log("[DEBUG] 401 detected - attempting token refresh");

      if (isRefreshing) {
        console.log("[DEBUG] Already refreshing - queuing request");
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log("[DEBUG] Retrying queued request");
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[DEBUG] Calling POST /auth/refresh");
        // Attempt to refresh the token
        // The refresh token is automatically sent via cookies (withCredentials: true)
        const refreshResponse = await apiClient.post<
          ApiResponse<{ accessToken: string }>
        >("/auth/refresh", {});

        console.log("[DEBUG] Token refresh successful:", refreshResponse.data);

        // New access token is set in cookies by the backend
        // No need to manually store it

        processQueue();
        isRefreshing = false;

        // Retry the original request (cookies will be sent automatically)
        console.log("[DEBUG] Retrying original request:", originalRequest.url);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error("[DEBUG] Token refresh failed:", {
          status: refreshError.response?.status,
          message: refreshError.message,
        });
        processQueue(refreshError);
        isRefreshing = false;

        console.error("Session refresh failed:", refreshError);
        toast.error("Your session has expired. Please login again.");

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
