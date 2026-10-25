import { expect, test } from "@playwright/test";

test("a deep link to a page that doesn't exist shows a way back", async ({ page }) => {
  await page.goto("/no-such-page");

  await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible();
  await page.getByRole("link", { name: "Back to job-tracker" }).click();
  // Nobody is signed in, so the way back leads through sign-in.
  await expect(page).toHaveURL("/sign-in");
});
