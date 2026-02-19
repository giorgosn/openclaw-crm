import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  // These tests check that pages load without errors
  // They'll redirect to login if not authenticated

  test("root redirects to home or login", async ({ page }) => {
    await page.goto("/");
    // Should redirect somewhere (login or home)
    await expect(page).not.toHaveURL("/");
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/OpenClaw|Login|Sign/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator("body")).toBeVisible();
  });
});
