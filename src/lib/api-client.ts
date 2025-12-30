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
const MAX_REFRESH_ATTEMPTS = 3; // Allow 3 attempts to handle token refresh

/**
 * Callback to notify when session is expired
 * This allows React components to update their state
 */
let sessionExpiredCallback: (() => void) | null = null;

/**
 * Callback to set global auth loading state from context
 * Called during session revalidation, recovery, or redirect
 */
let authLoadingCallback:
  | ((
      loading: boolean,
      reason?: "revalidating" | "redirecting" | "recovering"
    ) => void)
  | null = null;

/**
 * Callback to set redirect reason
 */
let redirectReasonCallback:
  | ((
      reason?: "session-expired" | "session-invalid" | "user-deleted" | "error"
    ) => void)
  | null = null;

export function setSessionExpiredCallback(callback: () => void) {
  sessionExpiredCallback = callback;
}

export function setAuthLoadingCallback(
  callback: (
    loading: boolean,
    reason?: "revalidating" | "redirecting" | "recovering"
  ) => void
) {
  authLoadingCallback = callback;
}

export function setRedirectReasonCallback(
  callback: (
    reason?: "session-expired" | "session-invalid" | "user-deleted" | "error"
  ) => void
) {
  redirectReasonCallback = callback;
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
    // HANDLE NETWORK ERRORS (e.g., ERR_CONNECTION_RESET after sleep)
    // ========================================================================

    if (!error.response) {
      // Network error occurred (no response from server)
      const errorMessage = error.message || "Network error";
      const isConnectionError =
        errorMessage.includes("ERR_CONNECTION_RESET") ||
        errorMessage.includes("ERR_NETWORK") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("TIMEOUT");

      console.warn("[AUTH] Network error detected", {
        message: errorMessage,
        isConnectionError,
        url: originalRequest.url,
      });

      // For connection errors on protected endpoints, suggest session revalidation
      if (isConnectionError && !isAuthEndpoint) {
        console.log(
          "[AUTH] Connection error on protected endpoint - may need session revalidation"
        );
        // Don't fail immediately - let the request timeout naturally
        // This gives the backend time to come back online
      }

      // Return the error as-is for higher-level handling
      return Promise.reject(error);
    }

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
        method: originalRequest.method,
        refreshAttemptCount,
        maxAttempts: MAX_REFRESH_ATTEMPTS,
        hasRefreshToken: !!getCookie("refreshToken"),
        cookies: document.cookie,
      });

      // If we've already tried refreshing too many times, session is expired
      if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
        console.error("[AUTH] Max refresh attempts reached - Session expired", {
          attempts: refreshAttemptCount,
        });

        // Signal that we're redirecting due to invalid session
        if (authLoadingCallback) {
          authLoadingCallback(true, "redirecting");
        }
        if (redirectReasonCallback) {
          redirectReasonCallback("session-invalid");
        }

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
          hasRefreshToken: !!getCookie("refreshToken"),
        });

        // Call refresh endpoint
        // Backend will set new accessToken cookie in response
        const refreshResponse = await apiClient.post("/auth/refresh", {});

        console.log("[AUTH] Token refresh successful", {
          attempt: refreshAttemptCount,
          status: refreshResponse.status,
          responseData: refreshResponse.data,
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
          refreshErrorData: refreshError.response?.data,
          url: refreshError.config?.url,
        });

        // Reject all queued requests
        processQueue(refreshError);
        isRefreshing = false;

        // Check if we should treat this as session expired
        // Only mark as expired on auth-specific errors, not temporary server errors
        const shouldExpireSession =
          refreshAttemptCount >= MAX_REFRESH_ATTEMPTS ||
          refreshStatus === 401 || // Unauthorized - refresh token invalid
          refreshStatus === 403 || // Forbidden - no permission
          refreshStatus === 404; // Not Found - user removed or invalid endpoint

        // Don't expire on 400 or 500 - those might be temporary

        if (shouldExpireSession) {
          console.log("[AUTH] Session expired - refresh failed with status", {
            status: refreshStatus,
            attempts: refreshAttemptCount,
            maxAttempts: MAX_REFRESH_ATTEMPTS,
          });

          // Set redirect reason based on status
          if (redirectReasonCallback) {
            if (refreshStatus === 404) {
              redirectReasonCallback("user-deleted");
            } else {
              redirectReasonCallback("session-invalid");
            }
          }

          // Signal that we're redirecting
          if (authLoadingCallback) {
            authLoadingCallback(true, "redirecting");
          }

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

        // Temporary error - clear loading state and retry
        // The original request will retry later when conditions improve
        if (authLoadingCallback) {
          authLoadingCallback(false);
        }

        return Promise.reject(refreshError);
      }
    }

    // ========================================================================
    // HANDLE 403 FORBIDDEN
    // ========================================================================

    if (error.response?.status === 403 && !isAuthEndpoint) {
      console.warn("[AUTH] 403 Forbidden - Access denied", {
        url: originalRequest.url,
      });

      // Set redirect reason
      if (redirectReasonCallback) {
        redirectReasonCallback("session-invalid");
      }

      // Signal that we're redirecting
      if (authLoadingCallback) {
        authLoadingCallback(true, "redirecting");
      }

      // Notify React components
      if (sessionExpiredCallback) {
        sessionExpiredCallback();
      }

      clearSessionCookies();
      return Promise.reject(new Error("Access forbidden - session invalid"));
    }

    // ========================================================================
    // HANDLE 404 - USER NOT FOUND
    // ========================================================================
    // HANDLE 404 - NOT FOUND (do NOT logout user)
    // ========================================================================
    // 404 means the endpoint/resource doesn't exist or bad request structure
    // This is NOT an authentication failure - should NOT trigger session expiration
    // Only auth errors (401, 403) should trigger logout

    if (error.response?.status === 404) {
      console.warn("[HTTP] 404 - Resource not found", {
        url: originalRequest.url,
        method: originalRequest.method,
      });

      // Simply reject the error - let the caller handle it
      // Do NOT clear session/cookies
      return Promise.reject(error);
    }

    // ========================================================================
    // HANDLE VERIFICATION ENDPOINT ERRORS (Special handling)
    // ========================================================================
    // Verification endpoints (/biometric/auth/verify, /user/topup) have specific
    // error handling. They should NOT trigger session expiration on business logic
    // errors (4xx errors from the verification service itself, not auth failures).
    // Only auth-level failures (401, 403) should trigger session expiration.

    const isVerificationEndpoint =
      originalRequest.url?.includes("/biometric/auth/verify") ||
      originalRequest.url?.includes("/user/topup");

    if (isVerificationEndpoint && !isAuthEndpoint) {
      // Verification endpoints may return 401 for two very different reasons:
      // 1) Auth-level failure (invalid/expired tokens) -> should expire session
      // 2) Business logic failure (e.g. "Challenge not found or expired") ->
      //    should NOT expire the session; caller handles it.
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Inspect message to distinguish auth failure vs business logic error
        const message =
          (error.response?.data && (error.response.data as any).message) || "";
        const normalized = String(message).toLowerCase();

        // Heuristic: treat it as an auth failure only when the message
        // clearly references tokens/authorization or contains typical auth
        // keywords. Business errors like "challenge not found" should not
        // log the user out.
        const authFailureKeywords = [
          "token",
          "access",
          "refresh",
          "unauthor",
          "not authenticated",
          "not authorized",
          "invalid credentials",
        ];

        // WebAuthn-specific business logic errors that should NOT expire session
        const webauthnBusinessErrors = [
          "counter validation failed",
          "replay attack",
          "challenge not found",
          "challenge expired",
          "invalid assertion",
        ];

        const isWebAuthnBusinessError = webauthnBusinessErrors.some((k) =>
          normalized.includes(k)
        );

        const looksLikeAuthFailure =
          !isWebAuthnBusinessError &&
          authFailureKeywords.some((k) => normalized.includes(k));

        console.error("[AUTH] Verification endpoint error", {
          status: error.response.status,
          url: originalRequest.url,
          message,
          looksLikeAuthFailure,
          isWebAuthnBusinessError,
        });

        if (looksLikeAuthFailure) {
          if (sessionExpiredCallback) {
            sessionExpiredCallback();
          }

          clearSessionCookies();
        } else {
          // Business logic 401 - do not expire session; let caller handle it
          console.log(
            "[AUTH] Verification endpoint returned business 401 - not expiring session",
            { url: originalRequest.url, message }
          );
        }
      }

      // For all verification endpoint errors, return the error as-is
      // The caller (verification.service.ts) will handle business logic errors
      return Promise.reject(error);
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
