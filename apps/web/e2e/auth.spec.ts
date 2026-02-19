import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign in")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("text=Create account")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("should navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Create account");
    await expect(page).toHaveURL(/register/);
  });

  test("should navigate from register to login", async ({ page }) => {
    await page.goto("/register");
    await page.click("text=Sign in");
    await expect(page).toHaveURL(/login/);
  });

  test("should show validation on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');
    // HTML5 validation should prevent submit with empty fields
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});
