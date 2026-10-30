import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { signUp } from "./accounts";

// One job seeker for the whole file, since sign-ups are rate limited per address. Its tests
// run one after another in one worker, so the sign-up below happens once.
test.describe.configure({ mode: "default" });

let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;
let tracked: string;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await signUp(page);
  await expect(page).toHaveURL("/");

  // One Application already tracked, so the table is on screen rather than the empty state,
  // and there is a page below the table to open quick add from.
  const added = await page.context().request.post("/api/applications", {
    data: { roleTitle: "Platform Intern", companyName: "GovTech", status: "applied" },
  });
  expect(added.status()).toBe(201);
  tracked = ((await added.json()) as { id: string }).id;

  signedIn = await page.context().storageState();
  await page.close();
});

/**
 * Opens a page of the app as the file's job seeker, and waits for it to be on screen: a key
 * pressed before the app has rendered reaches nothing, as it would for a real job seeker.
 */
async function openPage(browser: Browser, path: string): Promise<Page> {
  const page = await (await browser.newContext({ storageState: signedIn })).newPage();
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return page;
}

/**
 * Adds an Application the way a job seeker does from the keyboard alone: Ctrl+K, the command,
 * then the form. Nothing in here is clicked.
 */
async function quickAdd(page: Page, roleTitle: string, companyName: string) {
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();

  // The palette opens with its field ready, so a command is reached by typing its name.
  await page.keyboard.type("add");
  await expect(palette.getByRole("option", { name: "Add an Application" })).toBeVisible();
  await page.keyboard.press("Enter");

  const form = page.getByRole("dialog", { name: "Add an Application" });
  await expect(form).toBeVisible();
  // The form opens on the role title, and the Company is the next field along.
  await page.keyboard.type(roleTitle);
  await page.keyboard.press("Tab");
  await page.keyboard.type(companyName);
  await page.keyboard.press("Enter");
  await expect(form).toBeHidden();
}

test("a job seeker adds an Application with Ctrl+K, from the keyboard alone", async ({
  browser,
}) => {
  const page = await openPage(browser, "/");

  await quickAdd(page, "Backend Intern", "Shopee");

  // The row is there, and the table is still the page they were on.
  await expect(page.getByRole("cell", { name: /Backend Intern/ })).toBeVisible();
  await expect(page).toHaveURL("/");

  // It was saved, not only shown: a fresh load from the server still has it.
  await page.reload();
  await expect(page.getByRole("cell", { name: /Backend Intern/ })).toBeVisible();
});

test("quick add opens from a page below the table, and leaves the job seeker on it", async ({
  browser,
}) => {
  const page = await openPage(browser, `/applications/${tracked}`);
  const openApplication = page.getByRole("heading", { level: 1, name: "Platform Intern" });

  await quickAdd(page, "Data Intern", "Grab");

  // Still the Application they were reading, which quick add never left.
  await expect(page).toHaveURL(`/applications/${tracked}`);
  await expect(openApplication).toBeVisible();

  // And the new Application is on the table it was never added from.
  await page.goto("/");
  await expect(page.getByRole("cell", { name: /Data Intern/ })).toBeVisible();
});

test("the Application quick add saved is on the table before the server answers", async ({
  browser,
}) => {
  const page = await openPage(browser, "/");
  // The save is held open, so whatever is on the table is there without a server answer.
  let letTheServerAnswer!: () => void;
  const held = new Promise<void>((resolve) => {
    letTheServerAnswer = resolve;
  });
  let saving = false;
  await page.route("**/api/applications", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    saving = true;
    await held;
    return route.continue();
  });

  await quickAdd(page, "Design Intern", "Carousell");

  // The row is on the table while the Application it stands for is still on its way.
  await expect(page.getByRole("cell", { name: /Design Intern/ })).toBeVisible();
  expect(saving).toBe(true);

  letTheServerAnswer();
  // And once it lands, the row is the real thing: its Status can be changed from here.
  await expect(
    page.getByRole("combobox", { name: "Status of Design Intern at Carousell" }),
  ).toBeVisible();
});

test("Cmd+K opens the palette too, for a job seeker on a Mac", async ({ browser }) => {
  const page = await openPage(browser, "/");

  await page.keyboard.press("Meta+k");

  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
});

test("a second Ctrl+K leaves a half-written Application alone", async ({ browser }) => {
  const page = await openPage(browser, "/");
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Enter");
  const form = page.getByRole("dialog", { name: "Add an Application" });
  await expect(form).toBeVisible();
  await page.keyboard.type("Backend Intern");

  await page.keyboard.press("Control+k");

  // The form is still there with what was typed in it, and nothing is stacked over it.
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeHidden();
  await expect(form.getByLabel("Role title")).toHaveValue("Backend Intern");
});
