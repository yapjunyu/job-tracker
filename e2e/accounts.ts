import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

export const password = "correct horse battery staple";

/** Signs up with a new email address, which it returns. */
export async function signUp(page: Page): Promise<string> {
  const email = `${randomUUID()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  return email;
}
