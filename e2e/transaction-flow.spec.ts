import { test, expect } from "@playwright/test";

test.describe("Transaction Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Standard login flow (can be refactored to use storageState)
    await page.goto("/login");
    await page.fill("#credentials", "test@example.com");
    await page.fill("#password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should complete a data purchase successfully", async ({ page }) => {
    // 1. Navigate to Data Plans
    await page.click('a[href="/dashboard/data"]');
    await expect(page).toHaveURL("/dashboard/data");

    // 2. Select a product (wait for data to load)
    await page.waitForSelector('div[data-slot="card"]');
    const firstPlan = page.locator('div[data-slot="card"]').first();
    await firstPlan.click();

    // 3. Enter PIN in the Verification Modal
    // Note: This matches the PinVerificationModal structure
    const pinInput = page.locator('input[autocomplete="off"]');
    await expect(pinInput).toBeVisible();
    await pinInput.fill("1234");

    // 4. Expect success state
    // Success should trigger a redirect or a success modal state
    await expect(
      page
        .getByText(/Transaction Successful/i)
        .or(page.getByText(/Successful/i))
    ).toBeVisible({ timeout: 10000 });

    // 5. Verify receipt
    await expect(page.getByText(/Transaction Details/i)).toBeVisible();
  });
});
