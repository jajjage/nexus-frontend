/**
 * Health Check and Maintenance Detection Service
 * Detects when backend services are down and redirects to maintenance page
 */

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1", // Health check endpoint
  interval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds timeout
  maxRetries: 3, // Number of failed checks before considering down
};

// Counter for consecutive failed health checks
let failedHealthChecks = 0;
let healthCheckInterval: NodeJS.Timeout | null = null;
let isCheckingInitialStatus = false; // Flag to prevent multiple initial checks

/**
 * Perform a health check on the backend
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_CONFIG.timeout
    );

    const response = await fetch(HEALTH_CHECK_CONFIG.endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch (error) {
    console.warn("[Health Check] Backend appears to be down:", error);
    return false;
  }
}

/**
 * Redirect to maintenance page
 */
function redirectToMaintenance() {
  console.log("[Health Check] Redirecting to maintenance page");
  window.location.href = "/maintenance";
}

/**
 * Perform an immediate health check on app startup
 */
export async function checkInitialHealthStatus() {
  if (isCheckingInitialStatus) {
    // Prevent multiple initial checks
    return;
  }

  isCheckingInitialStatus = true;

  try {
    const isHealthy = await checkBackendHealth();

    if (!isHealthy) {
      failedHealthChecks++;
      if (failedHealthChecks >= HEALTH_CHECK_CONFIG.maxRetries) {
        redirectToMaintenance();
        return;
      }
    } else {
      failedHealthChecks = 0;
    }
  } finally {
    isCheckingInitialStatus = false;
  }
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring() {
  if (healthCheckInterval) {
    // Already running
    return;
  }

  healthCheckInterval = setInterval(async () => {
    const isHealthy = await checkBackendHealth();

    if (isHealthy) {
      // Backend is healthy, reset counter
      failedHealthChecks = 0;
    } else {
      // Backend is down, increment counter
      failedHealthChecks++;

      // If we've exceeded max retries, redirect to maintenance page
      if (failedHealthChecks >= HEALTH_CHECK_CONFIG.maxRetries) {
        redirectToMaintenance();
      }
    }
  }, HEALTH_CHECK_CONFIG.interval);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Manual health check - can be called from anywhere to immediately check status
 */
export async function manualHealthCheck(): Promise<boolean> {
  const isHealthy = await checkBackendHealth();

  if (!isHealthy) {
    failedHealthChecks++;
    if (failedHealthChecks >= HEALTH_CHECK_CONFIG.maxRetries) {
      redirectToMaintenance();
    }
  } else {
    failedHealthChecks = 0;
  }

  return isHealthy;
}

/**
 * Check if we should redirect to maintenance page based on current health status
 */
export async function shouldRedirectToMaintenance(): Promise<boolean> {
  const isHealthy = await checkBackendHealth();

  if (!isHealthy) {
    failedHealthChecks++;
    return failedHealthChecks >= HEALTH_CHECK_CONFIG.maxRetries;
  } else {
    failedHealthChecks = 0;
    return false;
  }
}
