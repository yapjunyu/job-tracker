import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const password = "correct horse battery staple";

/** Signs up with a new email address, which it returns. */
async function signUp(page: Page): Promise<string> {
  const email = `${randomUUID()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  return email;
}

test("a new job seeker signs up and lands on the empty app shell", async ({ page }) => {
  const email = await signUp(page);

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "No Applications yet" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "No Applications yet" })).toBeVisible();
});
