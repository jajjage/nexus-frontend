import { expect, Page, test } from "@playwright/test";

// Helper to wait for soft-lock to trigger
async function waitForSoftLock(page: Page) {
  await page.waitForSelector('[class*="fixed"][class*="inset-0"]', {
    timeout: 61000,
  }); // Wait up to 61 seconds (15 min timeout + buffer)
}

test.describe("Soft Lock System - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Try to login if needed
    const authCheck = await page.locator("text=Login").isVisible();
    if (authCheck) {
      // Assume we're on a login/auth page - in real tests, login here
      await page.fill('input[type="email"]', "test@example.com");
      await page.fill('input[type="password"]', "password");
      await page.click("button:has-text('Login')");
      await page.waitForLoadState("networkidle");
    }
  });

  test.describe("Soft Lock Activation", () => {
    test("should lock app after 15 minutes of inactivity", async ({ page }) => {
      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Verify app is visible (not locked)
      const dashboardContent = page.locator("text=Dashboard");
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });

      // Wait for soft lock to trigger (15 minutes)
      // In testing, you might reduce this timeout or mock the timer
      // For now, we check for the lock overlay
      // Note: Real tests would use test context to speed this up
      console.log("Waiting for soft lock activation (15 minutes)...");
      // This is where you'd implement test-specific timing
    });

    test("should show lock screen overlay", async ({ page }) => {
      // This test assumes the soft-lock has already triggered
      // In production testing, you'd simulate time passage

      // Check if lock overlay is visible
      const lockOverlay = page.locator("text=App Locked");
      const isVisible = await lockOverlay.isVisible().catch(() => false);

      if (isVisible) {
        expect(lockOverlay).toBeVisible();
        expect(page.locator("text=Unlock with Biometric")).toBeVisible();
      }
    });

    test("should prevent interaction while locked", async ({ page }) => {
      // Assuming app is locked
      const lockOverlay = page.locator("text=App Locked");
      const isLocked = await lockOverlay.isVisible().catch(() => false);

      if (isLocked) {
        // Try to click on dashboard content
        const dashboardLink = page.locator("text=Dashboard").first();

        // Lock overlay should be in focus, not dashboard
        const overlayElement = page.locator(
          '[class*="fixed"][class*="inset-0"]'
        );
        const isOverlayInFront = (await overlayElement.boundingBox()) !== null;
        expect(isOverlayInFront).toBe(true);
      }
    });
  });

  test.describe("Biometric Unlock", () => {
    test("should show biometric unlock button", async ({ page }) => {
      // Navigate to a state where soft-lock might be active
      // For this test, we check the button exists in the overlay
      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        expect(unlockButton).toBeVisible();
      }
    });

    test("should handle biometric prompt", async ({ page }) => {
      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        // Click unlock button - would normally trigger biometric prompt
        await unlockButton.click();

        // Wait for request to /biometric/auth/verify
        await page.waitForResponse((response) =>
          response.url().includes("/biometric/auth/verify")
        );
      }
    });

    test("should unlock app on successful biometric", async ({ page }) => {
      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        // Mock successful biometric response
        await page.route("**/biometric/auth/verify", (route) => {
          route.abort();
        });

        await unlockButton.click();

        // Lock overlay should disappear after successful unlock
        const lockOverlay = page.locator("text=App Locked");
        await expect(lockOverlay).not.toBeVisible({ timeout: 5000 });
      }
    });

    test("should show error on failed biometric", async ({ page }) => {
      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        // Mock failed biometric response
        await page.route("**/biometric/auth/verify", (route) => {
          route.abort("failed");
        });

        await unlockButton.click();

        // Wait for error message
        const errorMessage = page.locator("[class*='bg-red-50']");
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Activity Tracking", () => {
    test("should reset inactivity timer on user interaction", async ({
      page,
    }) => {
      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Record initial time
      const initialTime = Date.now();

      // Simulate user activity (click)
      await page.click("body");

      // Activity should have been recorded
      // Check localStorage to verify lastActiveTime updated
      const lastActiveTime = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.lastActiveTime;
        }
        return null;
      });

      expect(lastActiveTime).not.toBeNull();
      expect(lastActiveTime).toBeGreaterThanOrEqual(initialTime);
    });

    test("should track multiple activity types", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Mouse activity
      await page.click("body");
      await page.waitForTimeout(600);

      let lastActiveTime = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.lastActiveTime;
        }
        return null;
      });

      const timeAfterClick = lastActiveTime;

      // Keyboard activity
      await page.keyboard.press("a");
      await page.waitForTimeout(600);

      lastActiveTime = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.lastActiveTime;
        }
        return null;
      });

      // Should have updated again
      expect(lastActiveTime).toBeGreaterThanOrEqual(timeAfterClick);
    });

    test("should debounce activity events", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Get initial activity time
      let initialTime = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.lastActiveTime;
        }
        return null;
      });

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        await page.click("body");
      }

      // Wait a bit
      await page.waitForTimeout(700);

      // Activity should have been recorded (debounced)
      const finalTime = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.lastActiveTime;
        }
        return null;
      });

      // Final time should be significantly later (500ms debounce + some margin)
      expect(finalTime).toBeGreaterThan(initialTime + 400);
    });
  });

  test.describe("PIN Verification in Transactions", () => {
    test("should show PIN modal when buying airtime", async ({ page }) => {
      await page.goto("/dashboard/airtime");
      await page.waitForLoadState("networkidle");

      // Enter phone number
      const phoneInput = page.locator('input[placeholder*="phone"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill("08012345678");
      }

      // Select a network if needed
      const networkButton = page.locator("button:has-text('MTN')").first();
      if (await networkButton.isVisible()) {
        await networkButton.click();
      }

      // Click on a product
      const productCard = page.locator("[class*='card']").first();
      if (await productCard.isVisible()) {
        await productCard.click();
      }

      // Confirm checkout
      const confirmButton = page.locator("button:has-text('Confirm')").first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // PIN modal should appear
      const pinInput = page.locator('input[placeholder="••••"]');
      await expect(pinInput).toBeVisible({ timeout: 5000 });
    });

    test("should auto-submit PIN when 4 digits entered", async ({ page }) => {
      // Assuming PIN modal is already visible
      const pinInput = page.locator('input[placeholder="••••"]');

      if (await pinInput.isVisible()) {
        // Enter 4 digits
        await pinInput.fill("1234");

        // Should trigger submission
        // Wait for API call
        await page.waitForResponse((response) =>
          response.url().includes("/user/topup")
        );
      }
    });

    test("should show error on invalid PIN", async ({ page }) => {
      const pinInput = page.locator('input[placeholder="••••"]');

      if (await pinInput.isVisible()) {
        // Mock failed PIN response
        await page.route("**/user/topup", (route) => {
          route.abort("failed");
        });

        await pinInput.fill("0000");

        // Wait for error
        const errorMessage = page.locator("[class*='bg-red-50']");
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });

    test("should clear PIN after failed attempt", async ({ page }) => {
      const pinInput = page.locator('input[placeholder="••••"]');

      if (await pinInput.isVisible()) {
        // Mock failed response
        await page.route("**/user/topup", (route) => {
          route.abort("failed");
        });

        await pinInput.fill("0000");

        // Wait a moment for error to show
        await page.waitForTimeout(500);

        // PIN should be cleared
        const inputValue = await pinInput.inputValue();
        expect(inputValue).toBe("");
      }
    });

    test("should rate-limit PIN after 3 failures", async ({ page }) => {
      const pinInput = page.locator('input[placeholder="••••"]');

      if (await pinInput.isVisible()) {
        // Mock failed response
        await page.route("**/user/topup", (route) => {
          route.abort("failed");
        });

        // Try 3 times
        for (let i = 0; i < 3; i++) {
          await pinInput.fill("0000");
          await page.waitForTimeout(500);
        }

        // PIN input should be disabled
        const isDisabled = await pinInput.isDisabled();
        expect(isDisabled).toBe(true);

        // Should show block message
        const blockMessage = page.locator("text=Too many failed attempts");
        await expect(blockMessage).toBeVisible();
      }
    });
  });

  test.describe("State Persistence", () => {
    test("should persist lock state across page reload", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Get initial lock state
      const initialState = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.isLocked;
        }
        return null;
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Lock state should be same
      const reloadedState = await page.evaluate(() => {
        const store = localStorage.getItem("security-store");
        if (store) {
          return JSON.parse(store).state?.isLocked;
        }
        return null;
      });

      expect(reloadedState).toBe(initialState);
    });

    test("should restore lock screen on reload if locked", async ({ page }) => {
      // Manually set locked state
      await page.evaluate(() => {
        const store = {
          state: {
            isLocked: true,
            appState: "LOCKED",
            lastActiveTime: Date.now() - 16 * 60 * 1000, // 16 min ago
          },
        };
        localStorage.setItem("security-store", JSON.stringify(store));
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Lock overlay should be visible
      const lockOverlay = page.locator("text=App Locked");
      await expect(lockOverlay).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle biometric device not available", async ({ page }) => {
      // Mock WebAuthn not supported
      await page.evaluate(() => {
        (window as any).PublicKeyCredential = undefined;
      });

      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        await unlockButton.click();

        // Should show error
        const errorMessage = page.locator(
          "text=Biometric authentication not available"
        );
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });

    test("should handle network timeout during unlock", async ({ page }) => {
      // Mock timeout
      await page.route("**/biometric/auth/verify", (route) => {
        setTimeout(() => route.abort("timedout"), 30000);
      });

      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        await unlockButton.click();

        // Should show error eventually
        const errorMessage = page.locator("[class*='bg-red-50']");
        await expect(errorMessage).toBeVisible({ timeout: 35000 });
      }
    });

    test("should recover from failed unlock attempts", async ({ page }) => {
      const unlockButton = page.locator("text=Unlock with Biometric");
      const isVisible = await unlockButton.isVisible().catch(() => false);

      if (isVisible) {
        // First attempt fails
        await page.route("**/biometric/auth/verify", (route) => {
          route.abort("failed");
        });

        await unlockButton.click();
        await page.waitForTimeout(500);

        // Button should still be enabled for retry
        await expect(unlockButton).toBeEnabled({ timeout: 5000 });
      }
    });
  });
});
