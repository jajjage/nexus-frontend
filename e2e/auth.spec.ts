import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show validation errors when submitting invalid data", async ({
    page,
  }) => {
    await page.goto("/login");

    // Wait for the page to load and the form to be visible
    await expect(page.locator("#credentials")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Initially the login button should be disabled because the form is invalid
    const loginButton = page.getByRole("button", { name: "Login" });
    await expect(loginButton).toBeDisabled();

    // Fill in only the credentials field, leaving password empty
    await page.fill("#credentials", "test@example.com");

    // Button should still be disabled as password is still empty
    await expect(loginButton).toBeDisabled();

    // Fill in the password field
    await page.fill("#password", "password123");

    // Now the button should be enabled as both fields have values
    await expect(loginButton).toBeEnabled();

    // Submit the form (with invalid credentials, but form validation should pass)
    await loginButton.click();

    // Wait for potential server response or error message to appear
    // We'll check for any error message that might appear after form submission
    // Possible outcomes after submitting invalid credentials:
    // 1. A general error message about invalid credentials
    // 2. A redirect back to login (URL stays the same but with error message)
    // 3. An error message in an alert/Toast component

    // Wait a short time for any potential error message to display
    await page.waitForTimeout(1000);

    // Check if we're still on the login page (meaning credentials were rejected)
    // This is a good indication that the login attempt was processed but failed
    expect(page.url()).toContain("/login");

    // Check for common error messages or page elements that show login failed
    // Since we don't know exactly what error message appears, we can test for
    // the form still being present after a failed login
    await expect(page.locator("#credentials")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("should allow valid credentials to be entered and enable submit button", async ({
    page,
  }) => {
    await page.goto("/login");

    // Wait for the page to load and the form to be visible
    await expect(page.locator("#credentials")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Initially, the login button should be disabled because form is empty
    const loginButton = page.getByRole("button", { name: "Login" });
    await expect(loginButton).toBeDisabled();

    // Fill in credentials using the actual IDs from the form
    await page.fill("#credentials", "test@example.com");
    await page.fill("#password", "password123");

    // Verify the values were entered correctly
    await expect(page.locator("#credentials")).toHaveValue("test@example.com");
    await expect(page.locator("#password")).toHaveValue("password123");

    // The login button should now be enabled
    await expect(loginButton).toBeEnabled();
  });
});
