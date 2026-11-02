import {
  type Browser,
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";
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

/**
 * Drags the middle of one thing onto the middle of another. The board's drag sensor watches
 * pointer moves and only starts once the pointer has travelled, so the move is made in steps
 * rather than in one jump.
 */
async function drag(page: Page, from: Locator, onto: Locator) {
  const start = await from.boundingBox();
  if (!start) throw new Error("There is nothing on screen to drag.");
  const middleOf = async () => {
    const box = await onto.boundingBox();
    if (!box) throw new Error("There is nowhere on screen to drop.");
    return [box.x + box.width / 2, box.y + box.height / 2] as const;
  };

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(...(await middleOf()), { steps: 12 });
  // The board can scroll under the card on the way over, so it is aimed once more at where
  // the column has ended up before the card is let go.
  await page.mouse.move(...(await middleOf()));
  await page.mouse.up();
}

test("a job seeker drags a card to another column on the board", async ({ browser }) => {
  const { page, status } = await addApplication(browser, "Platform Intern");
  const toBoard = page.getByRole("link", { name: "Board" });
  await toBoard.click();
  const interviewing = page.getByRole("region", { name: "Interviewing" });

  await drag(page, page.getByRole("article").filter({ hasText: "Platform Intern" }), interviewing);

  await expect(interviewing.getByText("Platform Intern")).toBeVisible();
  await expect(status).toContainText("Interviewing");
  // The drag recorded a Status Change, so a fresh load from the server still has it.
  await page.reload();
  await toBoard.click();
  await expect(interviewing.getByText("Platform Intern")).toBeVisible();
});
