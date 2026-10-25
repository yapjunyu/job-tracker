import { expect, test } from "@playwright/test";

test("the web app is served from the same origin as the API it talks to", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "job-tracker" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Connected to the API");
});

test("a deep link to a page that doesn't exist shows a way back", async ({ page }) => {
  await page.goto("/no-such-page");

  await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible();
  await page.getByRole("link", { name: "Back to job-tracker" }).click();
  await expect(page).toHaveURL("/");
});
