import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import {
  addApplication,
  addApplicationOrThrow,
  getApplication,
  listApplications,
  newApplication,
} from "./applications";
import { startTestApp } from "./test-app";

describe("applications", () => {
  it("adds an Application and shows it in the table", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const added = await addApplication(
      app,
      cookie,
      newApplication({ roleTitle: "Backend Intern", companyName: "Shopee", status: "applied" }),
    );

    expect(added.status).toBe(201);
    const listed = await listApplications(app, cookie);
    expect(listed.status).toBe(200);
    expect(await listed.json()).toMatchObject([
      {
        roleTitle: "Backend Intern",
        company: { name: "Shopee" },
        status: "applied",
        source: null,
      },
    ]);
  });

  it("keeps everything the job seeker recorded about the role", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const details = newApplication({
      roleTitle: "Software Engineer Intern",
      companyName: "GovTech",
      status: "saved",
      source: "linkedin",
      postingLink: "https://example.com/jobs/1",
      location: "Singapore",
      pay: "SGD 3,000/month",
      jobDescription: "Build and ship internal tools.",
    });

    const { id } = await addApplicationOrThrow(app, cookie, details);

    const { companyName, ...recorded } = details;
    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      ...recorded,
      company: { name: companyName },
    });
  });

  it("refuses an Application the shared schema rejects, such as one with no role title", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const added = await addApplication(app, cookie, newApplication({ roleTitle: "  " }));

    expect(added.status).toBe(400);
    await expect((await listApplications(app, cookie)).json()).resolves.toEqual([]);
  });

  it("answers 401 to a job seeker who isn't signed in", async () => {
    const app = await startTestApp();

    expect((await app.request("/api/applications")).status).toBe(401);
  });
});

describe("companies", () => {
  it("creates the Company when the company name is one the job seeker hasn't used", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const shopee = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "Shopee" }),
    );
    const grab = await addApplicationOrThrow(app, cookie, newApplication({ companyName: "Grab" }));

    expect(grab.company.id).not.toBe(shopee.company.id);
  });

  it("reuses a Company whose name matches ignoring letter case", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const first = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "Shopee" }),
    );
    const second = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "shopee" }),
    );

    expect(second.company).toEqual(first.company);
    expect(second.company.name).toBe("Shopee");
  });

  it("keeps one job seeker's Company separate from another's with the same name", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);

    const myApplication = await addApplicationOrThrow(
      app,
      mine,
      newApplication({ companyName: "Grab" }),
    );
    const theirApplication = await addApplicationOrThrow(
      app,
      theirs,
      newApplication({ companyName: "Grab" }),
    );

    expect(theirApplication.company.id).not.toBe(myApplication.company.id);
  });
});

describe("the first Status Change", () => {
  it("records a Status Change for the Status the Application was added in", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const { id } = await addApplicationOrThrow(app, cookie, newApplication({ status: "applied" }));

    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      status: "applied",
      statusChanges: [{ status: "applied" }],
    });
  });

  it("keeps the Application's current Status and latest Status Change time in step with it", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const { id } = await addApplicationOrThrow(app, cookie, newApplication({ status: "saved" }));

    const application = (await (await getApplication(app, cookie, id)).json()) as {
      status: string;
      statusChangedAt: string;
      statusChanges: { status: string; occurredAt: string; recordedAt: string }[];
    };
    const [latest] = application.statusChanges;
    expect(latest).toBeDefined();
    expect(application.status).toBe(latest?.status);
    expect(application.statusChangedAt).toBe(latest?.occurredAt);
    // The two times are kept apart for v1.2, but nothing backdates a Status Change yet.
    expect(latest?.recordedAt).toBe(latest?.occurredAt);
  });
});

describe("one job seeker's Applications are private to them", () => {
  it("never lists another job seeker's Applications", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    await addApplicationOrThrow(app, theirs, newApplication({ roleTitle: "Their role" }));

    await addApplicationOrThrow(app, mine, newApplication({ roleTitle: "My role" }));

    expect(await (await listApplications(app, mine)).json()).toMatchObject([
      { roleTitle: "My role" },
    ]);
  });

  it("answers 404 for another job seeker's Application, so its existence stays hidden", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, theirs);

    const response = await getApplication(app, mine, id);

    expect(response.status).toBe(404);
  });

  it("answers 404 for an Application that doesn't exist", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const response = await getApplication(app, cookie, "00000000-0000-4000-8000-000000000000");

    expect(response.status).toBe(404);
  });
});
