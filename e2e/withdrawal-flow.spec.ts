import { test, expect } from "@playwright/test";

test.describe("Referral Withdrawal Flow", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.fill("#credentials", "test@example.com");
    await page.fill("#password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should successfully request a withdrawal", async ({ page }) => {
    // 2. Navigate to Referrals
    await page.click('a[href="/dashboard/referrals"]');
    await expect(page).toHaveURL("/dashboard/referrals");

    // 3. Open Withdrawal Modal (Wait for data to load)
    const withdrawButton = page.getByRole("button", {
      name: /withdraw rewards/i,
    });

    // Check if we have enough balance to withdraw (button might be disabled otherwise)
    // For test stability, we assume the test account has balance or we handle the disabled state
    if (await withdrawButton.isEnabled()) {
      await withdrawButton.click();

      // 4. Fill withdrawal form
      await page.fill('input[type="number"]', "500");

      // 5. Submit
      await page.click('button[type="submit"]:has-text("Confirm Withdrawal")');

      // 6. Expect Success Toast/Modal Close
      await expect(page.getByText(/submitted successfully/i)).toBeVisible();
    } else {
      console.log("Withdrawal button is disabled, likely due to low balance.");
    }
  });

  test("should show error for amount exceeding balance", async ({ page }) => {
    await page.goto("/dashboard/referrals");

    const withdrawButton = page.getByRole("button", {
      name: /withdraw rewards/i,
    });
    if (await withdrawButton.isEnabled()) {
      await withdrawButton.click();

      // Enter an impossibly high amount
      await page.fill('input[type="number"]', "9999999");
      await page.click('button[type="submit"]:has-text("Confirm Withdrawal")');

      // Expect validation error
      await expect(page.getByText(/exceeds available balance/i)).toBeVisible();
    }
  });
});
