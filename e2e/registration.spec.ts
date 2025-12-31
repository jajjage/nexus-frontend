import { test, expect } from "@playwright/test";

test.describe("Registration Flow with Referrals", () => {
  test("should show validation errors for invalid registration data", async ({
    page,
  }) => {
    await page.goto("/register");

    const submitButton = page.getByRole("button", {
      name: /create an account/i,
    });
    await expect(submitButton).toBeDisabled();

    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', "invalid-email");
    await page.fill('input[id="phoneNumber"]', "123");

    await expect(page.getByText(/invalid email address/i)).toBeVisible();
    await expect(
      page.getByText(/phone number must be between 11 and 14 digits/i)
    ).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("should auto-fill referral code from URL", async ({ page }) => {
    // Testing with ?code= param
    await page.goto("/register?code=REFERRAL123");
    const referralInput = page.locator('input[id="referralCode"]');
    await expect(referralInput).toHaveValue("REFERRAL123");

    // Testing with ?ref= param
    await page.goto("/register?ref=REF456");
    await expect(referralInput).toHaveValue("REF456");
  });

  test("should allow manual entry of referral code", async ({ page }) => {
    await page.goto("/register");
    const referralInput = page.locator('input[id="referralCode"]');
    await page.fill('input[id="referralCode"]', "MANUAL789");
    await expect(referralInput).toHaveValue("MANUAL789");
  });

  test("should enable submit button when all required fields are valid", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill('input[id="name"]', "John Doe");
    await page.fill('input[id="email"]', "john@example.com");
    await page.fill('input[id="phoneNumber"]', "08012345678");
    await page.fill('input[id="password"]', "Password123!");
    await page.fill('input[id="confirmPassword"]', "Password123!");

    const submitButton = page.getByRole("button", {
      name: /create an account/i,
    });
    await expect(submitButton).toBeEnabled();
  });
});
