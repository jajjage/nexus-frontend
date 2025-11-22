import { ErrorResponse } from "@/types/api.types";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

/**
 * Industry-Standard HTTP Client with Token Refresh Management
 *
 * ARCHITECTURE:
 * 1. HTTPOnly Cookies: Both accessToken and refreshToken stored as httpOnly cookies by backend
 * 2. Request Interceptor: Automatically adds Authorization header from cookies
 * 3. Response Interceptor: Handles 401 errors with automatic token refresh
 * 4. Queue Management: Queues failed requests during refresh to prevent duplicate requests
 * 5. Single Refresh Strategy: Only one refresh attempt happens, others wait for the result
 *
 * TOKEN LIFECYCLE:
 * - Access Token: 15 minutes (short-lived, expires frequently)
 * - Refresh Token: 24 hours (long-lived, used to get new access token)
 * - Request Flow: Authorization: Bearer {accessToken}
 * - On 401: Automatically calls POST /auth/refresh with refresh token from cookies
 * - Backend sets new accessToken cookie in response
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Get a cookie value by name
 * Note: We can read non-httpOnly cookies, but not httpOnly cookies from JavaScript
 * The Authorization header is set from httpOnly cookies by the server middleware
 */
const getCookie = (name: string): string | undefined => {
  if (typeof window === "undefined") return undefined;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return undefined;
};

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Critical: sends cookies with every request
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request Interceptor: Add authorization headers
 *
 * Note: accessToken is stored in httpOnly cookie, so we can't access it directly
 * However, the browser automatically sends it with each request via withCredentials
 * We don't need to manually add it to headers - the server middleware handles this
 *
 * If we need to add it manually, the backend should provide a way to read it
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add cache-busting headers to prevent stale responses
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// TOKEN REFRESH QUEUE MANAGEMENT
// ============================================================================

/**
 * Queue for requests that fail with 401 during token refresh
 * These requests will be retried after the token is successfully refreshed
 */
interface QueuedRequest {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

/**
 * Process all queued requests after token refresh
 * If refresh succeeded, resolve all queued requests to retry
 * If refresh failed, reject all queued requests
 */
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

// ============================================================================
// SESSION STATE TRACKING
// ============================================================================

/**
 * Track refresh attempts to prevent infinite loops
 * This is session-specific, not persisted across page reloads
 * For cross-session persistence, see sessionExpiredCallback
 */
let refreshAttemptCount = 0;
const MAX_REFRESH_ATTEMPTS = 2; // After 2 failures, consider session expired

/**
 * Callback to notify when session is expired
 * This allows React components to update their state
 */
let sessionExpiredCallback: (() => void) | null = null;

export function setSessionExpiredCallback(callback: () => void) {
  sessionExpiredCallback = callback;
}

// ============================================================================
// RESPONSE INTERCEPTOR - HANDLE 401 AND TOKEN REFRESH
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Reset attempt count on successful request
    refreshAttemptCount = 0;
    return response;
  },

  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Endpoints that should NOT trigger token refresh
    // These endpoints are part of the auth flow itself
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/logout",
      "/password/forgot-password",
      "/password/reset-password",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // ========================================================================
    // HANDLE 401 UNAUTHORIZED
    // ========================================================================

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      console.log("[AUTH] 401 Unauthorized - Attempting token refresh", {
        url: originalRequest.url,
        refreshAttemptCount,
        maxAttempts: MAX_REFRESH_ATTEMPTS,
      });

      // If we've already tried refreshing too many times, session is expired
      if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
        console.error("[AUTH] Max refresh attempts reached - Session expired", {
          attempts: refreshAttemptCount,
        });

        // Notify React components that session has expired
        if (sessionExpiredCallback) {
          sessionExpiredCallback();
        }

        // Clear cookies and session state
        clearSessionCookies();

        return Promise.reject(new Error("Session expired"));
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log("[AUTH] Token refresh in progress - Queueing request", {
          url: originalRequest.url,
        });

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log("[AUTH] Retrying queued request", {
              url: originalRequest.url,
            });
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark that we're refreshing and increment attempt count
      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttemptCount++;

      try {
        console.log("[AUTH] Starting token refresh", {
          attempt: refreshAttemptCount,
          maxAttempts: MAX_REFRESH_ATTEMPTS,
        });

        // Call refresh endpoint
        // Backend will set new accessToken cookie in response
        await apiClient.post("/auth/refresh", {});

        console.log("[AUTH] Token refresh successful", {
          attempt: refreshAttemptCount,
        });

        // Process all queued requests
        processQueue();
        isRefreshing = false;

        // Retry the original request with new token
        console.log("[AUTH] Retrying original request after refresh", {
          url: originalRequest.url,
        });
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        const refreshStatus = refreshError.response?.status;

        console.log("[AUTH] Token refresh failed", {
          status: refreshStatus,
          message: refreshError.message,
          attempt: refreshAttemptCount,
        });

        // Reject all queued requests
        processQueue(refreshError);
        isRefreshing = false;

        // Check if we should treat this as session expired
        const shouldExpireSession =
          refreshAttemptCount >= MAX_REFRESH_ATTEMPTS ||
          refreshStatus === 401 || // Unauthorized - token invalid
          refreshStatus === 400 || // Bad Request - might mean invalid token
          refreshStatus === 403 || // Forbidden
          refreshStatus === 404 || // Not Found - user removed or invalid endpoint
          refreshStatus === 500; // Server error on refresh endpoint

        if (shouldExpireSession) {
          console.log("[AUTH] Session expired - refresh failed with status", {
            status: refreshStatus,
            attempts: refreshAttemptCount,
            maxAttempts: MAX_REFRESH_ATTEMPTS,
          });

          // Notify React components
          if (sessionExpiredCallback) {
            console.log(
              "[AUTH] Calling sessionExpiredCallback from api-client"
            );
            sessionExpiredCallback();
          } else {
            console.error("[AUTH] sessionExpiredCallback is not set!");
          }

          clearSessionCookies();
          return Promise.reject(new Error("Session expired"));
        }

        return Promise.reject(refreshError);
      }
    }

    // ========================================================================
    // HANDLE OTHER ERRORS
    // ========================================================================

    return Promise.reject(error);
  }
);

// ============================================================================
// SESSION CLEANUP
// ============================================================================

function clearSessionCookies() {
  // Clear visible cookies
  const cookies = document.cookie.split(";");
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes("auth") || name.includes("token")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });

  // Clear auth-related localStorage
  localStorage.removeItem("auth_user_cache");
  localStorage.removeItem("auth_user_cache_time");

  // Show error message
  toast.error("Your session has expired. Please login again.");
}

// ============================================================================
// RESET FUNCTION (for logout)
// ============================================================================

export function resetAuthClient() {
  refreshAttemptCount = 0;
  isRefreshing = false;
  failedQueue = [];
  clearSessionCookies();
}

export default apiClient;
