import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

export const password = "correct horse battery staple";

/**
 * Signs up with a new email address, which it returns, and waits for the app to open. Sign-ups
 * are rate limited, and the spec files run side by side, so one that is turned away waits for
 * the limit to pass and tries again rather than failing the test that asked for an account.
 */
export async function signUp(page: Page): Promise<string> {
  const email = `${randomUUID()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.getByRole("button", { name: "Create account" }).click();
    try {
      await page.waitForURL("/", { timeout: 15_000 });
      return email;
    } catch (failedToOpen) {
      if (attempt === 3) throw failedToOpen;
    }
  }
  return email;
}
