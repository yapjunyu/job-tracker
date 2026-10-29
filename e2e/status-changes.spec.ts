import { type Browser, type BrowserContext, expect, test } from "@playwright/test";
import { signUp } from "./accounts";

// One job seeker for the whole file, since sign-ups are rate limited per address. Its tests
// run one after another in one worker, so the sign-up below happens once.
test.describe.configure({ mode: "default" });

let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await signUp(page);
  await expect(page).toHaveURL("/");
  signedIn = await page.context().storageState();
  await page.close();
});

/** Opens the table as the file's job seeker and adds an Application there, Saved at Shopee. */
async function addApplication(browser: Browser, roleTitle: string) {
  const page = await (await browser.newContext({ storageState: signedIn })).newPage();
  await page.goto("/");
  await page.getByRole("button", { name: /^Add (your first )?Application$/ }).click();
  await page.getByLabel("Role title").fill(roleTitle);
  // Exactly the form's own field: the table behind the dialog has a Company filter too.
  await page.getByLabel("Company", { exact: true }).fill("Shopee");
  await page.getByRole("button", { name: "Add Application" }).click();
  const status = page.getByRole("combobox", { name: `Status of ${roleTitle} at Shopee` });
  return { page, status };
}

test("a job seeker changes an Application's Status from its table row", async ({ browser }) => {
  const { page, status } = await addApplication(browser, "Backend Intern");

  await status.click();
  await page.getByRole("option", { name: "Interviewing" }).click();

  await expect(status).toContainText("Interviewing");
  // It was saved, not only shown: a fresh load from the server still has it.
  await page.reload();
  await expect(status).toContainText("Interviewing");
  await page.getByRole("link", { name: "Backend Intern" }).click();
  await expect(page.getByRole("combobox", { name: /^Status recorded/ })).toContainText([
    "Interviewing",
    "Saved",
  ]);
});

test("a Status change the server refuses goes back, with a message saying why", async ({
  browser,
}) => {
  const { page, status } = await addApplication(browser, "Frontend Intern");
  // The server's answer waits until the change has been seen on screen.
  const { promise: answered, resolve: answer } = Promise.withResolvers<undefined>();
  await page.route("**/status-changes", async (route) => {
    await answered;
    await route.fulfill({ status: 500, json: { message: "Something went wrong." } });
  });

  await status.click();
  await page.getByRole("option", { name: "Rejected" }).click();
  await expect(status).toContainText("Rejected");
  answer(undefined);

  await expect(page.getByText("That Status wasn't changed.")).toBeVisible();
  await expect(page.getByText("Something went wrong.")).toBeVisible();
  await expect(status).toContainText("Saved");
});
