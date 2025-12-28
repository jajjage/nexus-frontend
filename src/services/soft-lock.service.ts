/**
 * Soft Lock Service
 *
 * Handles user activity tracking and inactivity detection
 * Debounces activity listeners to prevent performance issues
 */

export class SoftLockService {
  private static activityListeners: Map<string, EventListener> = new Map();

  /**
   * Initialize soft-lock activity tracking
   *
   * @param onActivity - Callback when user activity is detected
   */
  static initialize(onActivity: () => void): void {
    const debouncedActivity = this.debounce(onActivity, 500);

    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];

    activities.forEach((activity) => {
      const listener = (e: Event) => debouncedActivity();
      this.activityListeners.set(activity, listener as EventListener);
      document.addEventListener(activity, listener as EventListener, {
        passive: true,
      });
    });

    console.log(
      "[SoftLock] Service initialized - activity listeners registered"
    );
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
    ];

    activities.forEach((activity) => {
      const listener = this.activityListeners.get(activity);
      if (listener) {
        document.removeEventListener(activity, listener);
        this.activityListeners.delete(activity);
      }
    });

    console.log("[SoftLock] Service cleanup - all listeners removed");
  }
}
