import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { signUp } from "./accounts";

// One job seeker for the whole file, with one set of Applications: sign-ups are rate limited
// per address, and these tests only read the table unless they say otherwise. They run one
// after another in one worker, so the set-up below happens once.
test.describe.configure({ mode: "default" });

let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;

/** Adds an Application the way the add form does, without going through the form each time. */
async function add(request: APIRequestContext, application: object) {
  const response = await request.post("/api/applications", { data: application });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await signUp(page);
  await expect(page).toHaveURL("/");

  const { request } = page.context();
  await add(request, {
    roleTitle: "Backend Intern",
    companyName: "Shopee",
    source: "linkedin",
    status: "applied",
  });
  await add(request, {
    roleTitle: "Frontend Intern",
    companyName: "Grab",
    source: "referral",
    status: "applied",
  });
  await add(request, { roleTitle: "Data Intern", companyName: "GovTech", status: "saved" });
  const finished = await add(request, {
    roleTitle: "Platform Intern",
    companyName: "Shopee",
    status: "applied",
  });
  const rejected = await request.post(`/api/applications/${finished.id}/status-changes`, {
    data: { status: "rejected" },
  });
  expect(rejected.status()).toBe(201);

  signedIn = await page.context().storageState();
  await page.close();
});

/** The table, open as the job seeker whose Applications these are. */
async function openTable(browser: Browser, viewport?: { width: number; height: number }) {
  const context = await browser.newContext({
    storageState: signedIn,
    ...(viewport && { viewport }),
  });
  const page = await context.newPage();
  await page.goto("/");
  return page;
}

/** The role title of every row the table is showing, in the order it has them. */
function roleTitles(page: Page) {
  return page.locator("tbody tr td:first-child");
}

test("the table shows only active Applications, and all of them at one click", async ({
  browser,
}) => {
  const page = await openTable(browser);

  // Latest Status Change first, and the rejected one is nowhere in the list.
  await expect(roleTitles(page)).toHaveText([/Data Intern/, /Frontend Intern/, /Backend Intern/]);

  // The counts row is both how the search reads and how it is narrowed: All takes in the
  // Applications that have finished.
  await page.getByRole("tab", { name: "All" }).click();

  await expect(roleTitles(page)).toHaveText([
    /Platform Intern/,
    /Data Intern/,
    /Frontend Intern/,
    /Backend Intern/,
  ]);
});

test("a search finds an Application by role title and by Company", async ({ browser }) => {
  const page = await openTable(browser);
  await expect(roleTitles(page)).toHaveCount(3);

  // `/` puts the job seeker in the search field from anywhere on the table.
  await page.keyboard.press("/");
  await page.keyboard.type("front");

  await expect(roleTitles(page)).toHaveText([/Frontend Intern/]);

  await page.getByLabel("Search Applications").fill("shopee");

  // Here it is the Company's name that matches, not the role title.
  await expect(roleTitles(page)).toHaveText([/Backend Intern/]);
});

test("a filter narrows the table down to one Status", async ({ browser }) => {
  const page = await openTable(browser);

  await page.getByRole("combobox", { name: "Filter by Status" }).click();
  await page.getByRole("option", { name: "Saved" }).click();
  // A filter holds as many Statuses as are picked, so its list stays open until dismissed.
  await page.keyboard.press("Escape");

  await expect(roleTitles(page)).toHaveText([/Data Intern/]);

  await page.getByRole("button", { name: "Clear filters" }).click();

  await expect(roleTitles(page)).toHaveCount(3);
});

test("a column header sorts the table by that column, and turns it around", async ({ browser }) => {
  const page = await openTable(browser);
  const role = page.getByRole("button", { name: "Role" });

  await role.click();

  await expect(roleTitles(page)).toHaveText([/Backend Intern/, /Data Intern/, /Frontend Intern/]);

  await role.click();

  await expect(roleTitles(page)).toHaveText([/Frontend Intern/, /Data Intern/, /Backend Intern/]);

  await page.getByRole("button", { name: "Company" }).click();

  // GovTech, Grab, Shopee: letter case decides nothing, and nor does the role title.
  await expect(roleTitles(page)).toHaveText([/Data Intern/, /Frontend Intern/, /Backend Intern/]);
});

test("the keyboard moves between Applications and opens the one it is on", async ({ browser }) => {
  const page = await openTable(browser);
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(3);

  await page.keyboard.press("j");
  await expect(rows.first()).toBeFocused();

  await page.keyboard.press("j");
  await expect(rows.nth(1)).toBeFocused();

  await page.keyboard.press("k");
  await expect(rows.first()).toBeFocused();

  await page.keyboard.press("Enter");

  // The first row is the Application with the latest Status Change: Data Intern.
  await expect(page.getByRole("heading", { name: "Data Intern" })).toBeVisible();
});

test("`?` says what every shortcut does", async ({ browser }) => {
  const page = await openTable(browser);
  await expect(roleTitles(page)).toHaveCount(3);

  await page.keyboard.press("?");

  const help = page.getByRole("dialog");
  await expect(help.getByText("Keyboard shortcuts")).toBeVisible();
  await expect(help.getByText("Change its Status")).toBeVisible();
});

test("the table is workable at phone width", async ({ browser }) => {
  const page = await openTable(browser, { width: 375, height: 812 });

  // The columns a phone has no room for are sorted by from the bar instead of their headers.
  await page.getByLabel("Sort by").click();
  await page.getByRole("option", { name: "Role" }).click();

  await expect(roleTitles(page)).toHaveText([/Backend Intern/, /Data Intern/, /Frontend Intern/]);
  // Nothing is wider than the phone: the table scrolls inside the page rather than with it.
  const main = await page.locator("main").boundingBox();
  expect(main?.width).toBeLessThanOrEqual(375);
  await expect(page.getByLabel("Search Applications")).toBeVisible();
});

test("the keyboard changes the Status of the Application it is on", async ({ browser }) => {
  const page = await openTable(browser);
  await expect(page.locator("tbody tr")).toHaveCount(3);

  await page.keyboard.press("j");
  await page.keyboard.press("s");
  await page.getByRole("option", { name: "Interviewing" }).click();

  const status = page.getByRole("combobox", { name: /^Status of Data Intern/ });
  await expect(status).toContainText("Interviewing");
  // It was saved, not only shown: a fresh load from the server still has it.
  await page.reload();
  await expect(status).toContainText("Interviewing");
});
