import { expect, test } from "@playwright/test";
import { password, signUp } from "./accounts";

test("a new job seeker signs up and lands on an app with nothing in it yet", async ({ page }) => {
  const email = await signUp(page);

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Nothing tracked yet." })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("a signed-out visit to an app page goes to sign-in", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a job seeker signs out, and signs back in with their email and password", async ({
  page,
}) => {
  const email = await signUp(page);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
  await page.goto("/");
  await expect(page).toHaveURL("/sign-in");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Nothing tracked yet." })).toBeVisible();
});
