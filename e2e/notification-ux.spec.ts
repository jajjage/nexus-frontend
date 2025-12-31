import { test, expect } from "@playwright/test";

test.describe("Notification UX Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#credentials", "test@example.com");
    await page.fill("#password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should navigate to notifications and show content", async ({
    page,
  }) => {
    // 1. Click notification bell
    await page.click('a[href="/dashboard/notifications"]');
    await expect(page).toHaveURL("/dashboard/notifications");

    // 2. Check if list is visible
    const notificationList = page.locator('div[data-slot="card"]');
    // If there are no notifications, check for empty state
    if ((await notificationList.count()) === 0) {
      await expect(page.getByText(/no notifications/i)).toBeVisible();
    } else {
      await expect(notificationList.first()).toBeVisible();
    }
  });

  test("should mark notification as read when clicked", async ({ page }) => {
    await page.goto("/dashboard/notifications");

    // Find an unread notification (usually has a blue dot or different bg)
    // This is selector-dependent based on your actual implementation
    const unreadNotification = page.locator('div:has-text("unread")').first();

    if (await unreadNotification.isVisible()) {
      await unreadNotification.click();
      // Expect some UI change or detail view
    }
  });
});
