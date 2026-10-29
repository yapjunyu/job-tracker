import { applicationListQuery, type ApplicationListParams } from "@job-tracker/shared";
import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import { addApplicationOrThrow, listApplications, newApplication } from "./applications";
import { changeStatusOrThrow } from "./status-changes";
import { startTestApp, type TestApp } from "./test-app";

/** The table's rows as the list answered with them, failing the test if it refused to. */
async function table(app: TestApp, cookie: string, params: Partial<ApplicationListParams> = {}) {
  const response = await listApplications(
    app,
    cookie,
    applicationListQuery({
      search: "",
      status: [],
      source: [],
      company: [],
      activeOnly: true,
      sort: "statusChangedAt",
      direction: "desc",
      ...params,
    }),
  );
  if (response.status !== 200) throw new Error(`Listing failed with ${response.status}`);
  return (await response.json()) as { id: string; roleTitle: string }[];
}

/** The role titles the list answered with, in the order it put them. */
async function roleTitles(
  app: TestApp,
  cookie: string,
  params: Partial<ApplicationListParams> = {},
) {
  return (await table(app, cookie, params)).map((row) => row.roleTitle);
}

/**
 * A job seeker with a search under way: four Applications across three Companies, three
 * Sources and four Statuses, one of them finished.
 */
async function aSearchUnderWay(app: TestApp, cookie: string) {
  const backend = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({
      roleTitle: "Backend Intern",
      companyName: "Shopee",
      source: "linkedin",
      status: "applied",
    }),
  );
  const frontend = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({
      roleTitle: "Frontend Intern",
      companyName: "grab",
      source: "referral",
      status: "applied",
    }),
  );
  const data = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({ roleTitle: "Data Intern", companyName: "GovTech", status: "saved" }),
  );
  const platform = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({
      roleTitle: "Platform Intern",
      companyName: "Shopee",
      source: "linkedin",
      status: "applied",
    }),
  );
  // Each Status Change is recorded as it is asked for, so these two are the latest of the four.
  await changeStatusOrThrow(app, cookie, frontend.id, "interviewing");
  await changeStatusOrThrow(app, cookie, platform.id, "rejected");
  return { backend, frontend, data, platform };
}

describe("the table's default view", () => {
  it("hides Applications that have finished", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie)).not.toContain("Platform Intern");
  });

  it("shows every Application once active-only is turned off", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { activeOnly: false })).toContain("Platform Intern");
  });

  it("puts the latest Status Change first, and oldest first the other way round", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { frontend } = await aSearchUnderWay(app, cookie);

    const latestFirst = await table(app, cookie);
    const oldestFirst = await table(app, cookie, { direction: "asc" });

    // Its move to Interviewing is the latest Status Change of any active Application.
    expect(latestFirst[0]?.id).toBe(frontend.id);
    expect(oldestFirst.at(-1)?.id).toBe(frontend.id);
  });
});

describe("filtering the table", () => {
  it("filters by Status", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { status: ["saved"] })).toEqual(["Data Intern"]);
  });

  it("filters by several Statuses at once", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { status: ["saved", "interviewing"] });

    expect(titles.toSorted()).toEqual(["Data Intern", "Frontend Intern"]);
  });

  it("asks for a final Status by filtering for it, which takes over from the active-only view", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    // Active-only is still on: a Status filter says exactly which Statuses are wanted.
    const titles = await roleTitles(app, cookie, { status: ["rejected"] });

    expect(titles).toEqual(["Platform Intern"]);
  });

  it("filters by Source", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { source: ["referral"] })).toEqual(["Frontend Intern"]);
  });

  it("filters by Company", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { backend } = await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { company: [backend.company.id] });

    // Both Shopee Applications, and the finished one only when it is asked for.
    expect(titles).toEqual(["Backend Intern"]);
    expect(
      await roleTitles(app, cookie, { company: [backend.company.id], activeOnly: false }),
    ).toHaveLength(2);
  });

  it("combines filters, answering with the Applications that match them all", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { backend } = await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, {
      status: ["applied"],
      source: ["linkedin"],
      company: [backend.company.id],
      search: "backend",
    });

    expect(titles).toEqual(["Backend Intern"]);
  });

  it("answers with nothing when the filters leave nothing", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { status: ["offer"] })).toEqual([]);
  });

  it("never reaches another job seeker's Applications, whatever is filtered for", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const theirApplication = await addApplicationOrThrow(
      app,
      theirs,
      newApplication({ roleTitle: "Their Intern", companyName: "Shopee", source: "linkedin" }),
    );
    await addApplicationOrThrow(app, mine, newApplication({ roleTitle: "My Intern" }));

    expect(
      await roleTitles(app, mine, {
        search: "intern",
        source: ["linkedin"],
        company: [theirApplication.company.id],
      }),
    ).toEqual([]);
  });
});

describe("searching the table", () => {
  it("finds an Application by part of its role title, ignoring letter case", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { search: "FRONT" })).toEqual(["Frontend Intern"]);
  });

  it("finds every Application at a Company by part of its name", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { search: "shope", activeOnly: false });

    expect(titles.toSorted()).toEqual(["Backend Intern", "Platform Intern"]);
  });

  it("matches a % the job seeker typed as itself, not as anything at all", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    expect(await roleTitles(app, cookie, { search: "%" })).toEqual([]);
  });
});

describe("sorting the table", () => {
  it("sorts by role title either way", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { sort: "roleTitle", direction: "asc" });

    expect(titles).toEqual(["Backend Intern", "Data Intern", "Frontend Intern"]);
    expect(await roleTitles(app, cookie, { sort: "roleTitle", direction: "desc" })).toEqual(
      titles.toReversed(),
    );
  });

  it("sorts by Company name, ignoring letter case", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { sort: "company", direction: "asc" });

    // "GovTech", "grab" and "Shopee": letter case decides nothing about the order.
    expect(titles).toEqual(["Data Intern", "Frontend Intern", "Backend Intern"]);
  });

  it("sorts by Status the way an Application moves through them, not by name", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    const titles = await roleTitles(app, cookie, { sort: "status", direction: "asc" });

    // Saved, then Applied, then Interviewing: by name it would be Applied, Interviewing, Saved.
    expect(titles).toEqual(["Data Intern", "Backend Intern", "Frontend Intern"]);
  });

  it("leaves an Application with no Source last whichever way Source is sorted", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await aSearchUnderWay(app, cookie);

    for (const direction of ["asc", "desc"] as const) {
      const titles = await roleTitles(app, cookie, { sort: "source", direction });
      expect(titles.at(-1)).toBe("Data Intern");
    }
  });
});

describe("list parameters the API won't take", () => {
  it("refuses a Status that isn't one", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    expect((await listApplications(app, cookie, "status=nonsense")).status).toBe(400);
  });

  it("refuses a column the table can't be sorted by", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    expect((await listApplications(app, cookie, "sort=pay")).status).toBe(400);
  });

  it("refuses a Company filter that isn't an id", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    expect((await listApplications(app, cookie, "company=not-an-id")).status).toBe(400);
  });
});
