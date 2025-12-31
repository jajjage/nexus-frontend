import { test, expect } from "@playwright/test";

test.describe("Profile & Security Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#credentials", "test@example.com");
    await page.fill("#password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should successfully update transaction PIN", async ({ page }) => {
    // 1. Navigate to Profile
    await page.goto("/dashboard/profile");

    // 2. Go to Security
    await page.click('a[href="/dashboard/profile/security"]');

    // 3. Go to PIN management
    await page.click('a[href="/dashboard/profile/security/pin"]');

    // 4. Fill PIN update form
    // Note: Assuming standard password/pin input types
    await page.fill('input[name="currentPassword"]', "Password123!");
    await page.fill('input[name="pin"]', "1234");
    await page.fill('input[name="confirmPin"]', "1234");

    // 5. Submit
    await page.click('button[type="submit"]:has-text("Set PIN")');

    // 6. Expect Success Toast
    await expect(page.getByText(/successfully/i)).toBeVisible();

    // 7. Verify we are back on the security page
    await expect(page).toHaveURL(/\/dashboard\/profile/);
  });
});
