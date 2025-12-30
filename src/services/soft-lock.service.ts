/**
 * Soft Lock Service
 *
 * Handles user activity tracking and inactivity detection
 * Debounces activity listeners to prevent performance issues
 * NEW: Detects page visibility changes and browser close events
 */

export class SoftLockService {
  private static activityListeners: Map<string, EventListener> = new Map();
  private static isActivityTrackingEnabled = true; // NEW: Track if activity recording is enabled

  /**
   * Initialize soft-lock activity tracking
   *
   * @param onActivity - Callback when user activity is detected
   * @param onVisibilityChange - Callback when page visibility changes (tab switch, minimize)
   */
  static initialize(
    onActivity: () => void,
    onVisibilityChange?: (hidden: boolean) => void
  ): void {
    const debouncedActivity = this.debounce(() => {
      // NEW: Only record activity if tracking is enabled
      if (this.isActivityTrackingEnabled) {
        onActivity();
      }
    }, 500);

    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];

    // ==========================================
    // Activity Listeners
    // ==========================================
    activities.forEach((activity) => {
      const listener = (e: Event) => debouncedActivity();
      this.activityListeners.set(activity, listener as EventListener);
      document.addEventListener(activity, listener as EventListener, {
        passive: true,
      });
    });

    // ==========================================
    // NEW: Page Visibility API Listener
    // ==========================================
    const visibilityListener = () => {
      console.log("[SoftLock] Page visibility changed", {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });

      if (onVisibilityChange) {
        onVisibilityChange(document.hidden);
      }
    };

    this.activityListeners.set("visibilitychange", visibilityListener as any);
    document.addEventListener("visibilitychange", visibilityListener);

    // ==========================================
    // NEW: Browser Close Detection
    // ==========================================
    const beforeUnloadListener = () => {
      console.log("[SoftLock] Browser closing - saving close timestamp");
      const now = Date.now();
      localStorage.setItem("app_closed_at", now.toString());
    };

    this.activityListeners.set("beforeunload", beforeUnloadListener as any);
    window.addEventListener("beforeunload", beforeUnloadListener);

    console.log(
      "[SoftLock] Service initialized - activity listeners registered (including visibility & close)"
    );
  }

  /**
   * NEW: Disable activity tracking (call when lock overlay appears)
   * Prevents clicks/keyboard input from unlocking the app
   */
  static disableActivityTracking(): void {
    console.log("[SoftLock] Activity tracking disabled");
    this.isActivityTrackingEnabled = false;
  }

  /**
   * NEW: Enable activity tracking (call when lock overlay closes)
   * Resumes normal activity detection
   */
  static enableActivityTracking(): void {
    console.log("[SoftLock] Activity tracking enabled");
    this.isActivityTrackingEnabled = true;
  }

  /**
   * Debounce utility
   * Prevents excessive callback calls
   */
  private static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    }) as T;
  }

  /**
   * Cleanup - remove all listeners
   * Call on app unmount
   */
  static cleanup(): void {
    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
      "visibilitychange",
      "beforeunload",
    ];

    activities.forEach((activity) => {
      const listener = this.activityListeners.get(activity);
      if (listener) {
        if (activity === "beforeunload") {
          window.removeEventListener(activity as any, listener);
        } else {
          document.removeEventListener(activity, listener);
        }
        this.activityListeners.delete(activity);
      }
    });

    console.log("[SoftLock] Service cleanup - all listeners removed");
  }
}
