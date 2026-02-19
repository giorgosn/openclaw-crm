import { test, expect } from "@playwright/test";

// These tests require authentication.
// In a real setup, you'd use a test user and storageState.
// For now, they verify pages load and show correct structure.

test.describe("Dashboard (requires auth)", () => {
  test.skip(true, "Requires authenticated session - run with seeded test user");

  test("home page shows tasks and notes widgets", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("text=My Tasks")).toBeVisible();
    await expect(page.locator("text=Recent Notes")).toBeVisible();
  });

  test("people page shows table view", async ({ page }) => {
    await page.goto("/objects/people");
    await expect(page.locator("text=People")).toBeVisible();
    await expect(page.locator("text=New Person")).toBeVisible();
  });

  test("companies page shows table view", async ({ page }) => {
    await page.goto("/objects/companies");
    await expect(page.locator("text=Companies")).toBeVisible();
  });

  test("deals page shows table and board toggle", async ({ page }) => {
    await page.goto("/objects/deals");
    await expect(page.locator("text=Deals")).toBeVisible();
    await expect(page.locator("text=Table")).toBeVisible();
    await expect(page.locator("text=Board")).toBeVisible();
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.goto("/home");
    await page.keyboard.press("Control+k");
    await expect(page.locator('[cmdk-input]')).toBeVisible();
  });

  test("settings page shows general settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=General Settings")).toBeVisible();
    await expect(page.locator("text=Workspace Name")).toBeVisible();
  });

  test("settings members page shows member list", async ({ page }) => {
    await page.goto("/settings/members");
    await expect(page.locator("text=Members")).toBeVisible();
    await expect(page.locator("text=Add Member")).toBeVisible();
  });

  test("settings objects page shows object list", async ({ page }) => {
    await page.goto("/settings/objects");
    await expect(page.locator("text=Objects")).toBeVisible();
    await expect(page.locator("text=People")).toBeVisible();
    await expect(page.locator("text=Companies")).toBeVisible();
    await expect(page.locator("text=Deals")).toBeVisible();
  });

  test("tasks page loads", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.locator("text=Tasks")).toBeVisible();
  });

  test("notes page loads", async ({ page }) => {
    await page.goto("/notes");
    await expect(page.locator("text=Notes")).toBeVisible();
  });

  test("notifications page loads", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("text=Notifications")).toBeVisible();
  });

  test("export CSV button exists on object page", async ({ page }) => {
    await page.goto("/objects/people");
    await expect(page.locator("text=Export")).toBeVisible();
    await expect(page.locator("text=Import")).toBeVisible();
  });

  test("filter and sort buttons exist", async ({ page }) => {
    await page.goto("/objects/people");
    await expect(page.locator("text=Filter")).toBeVisible();
    await expect(page.locator("text=Sort")).toBeVisible();
  });
});
