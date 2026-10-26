import type { Application } from "@job-tracker/shared";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import {
  addApplication,
  addApplicationOrThrow,
  applicationDetails,
  deleteApplication,
  editApplication,
  getApplication,
  listApplications,
  newApplication,
} from "./applications";
import { createTestDatabaseUrl, startApp, startTestApp } from "./test-app";

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

  it("never edits another job seeker's Application", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const theirApplication = await addApplicationOrThrow(app, theirs);

    const edited = await editApplication(
      app,
      mine,
      theirApplication.id,
      applicationDetails({ roleTitle: "Mine now" }),
    );

    expect(edited.status).toBe(404);
    await expect((await getApplication(app, theirs, theirApplication.id)).json()).resolves.toEqual(
      theirApplication,
    );
  });

  it("never deletes another job seeker's Application", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const theirApplication = await addApplicationOrThrow(app, theirs);

    const deleted = await deleteApplication(app, mine, theirApplication.id);

    expect(deleted.status).toBe(404);
    expect((await getApplication(app, theirs, theirApplication.id)).status).toBe(200);
  });
});

describe("editing an Application", () => {
  it("replaces the details the job seeker sends", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Backend Intern" }),
    );

    const edited = await editApplication(
      app,
      cookie,
      id,
      applicationDetails({ roleTitle: "Backend Engineer Intern", location: "Singapore" }),
    );

    expect(edited.status).toBe(200);
    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      roleTitle: "Backend Engineer Intern",
      location: "Singapore",
    });
  });

  it("clears a detail the job seeker emptied, since the form sends every detail at once", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ location: "Singapore", pay: "SGD 3,000/month" }),
    );

    await editApplication(app, cookie, id, applicationDetails({ pay: "SGD 3,500/month" }));

    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      location: null,
      pay: "SGD 3,500/month",
    });
  });

  it("moves the Application to the Company the job seeker named, creating a new one", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie, newApplication({ companyName: "Grab" }));

    await editApplication(app, cookie, added.id, applicationDetails({ companyName: "Shopee" }));

    const edited = (await (await getApplication(app, cookie, added.id)).json()) as Application;
    expect(edited.company.name).toBe("Shopee");
    expect(edited.company.id).not.toBe(added.company.id);
  });

  it("reuses a Company whose name matches ignoring letter case", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "Shopee" }),
    );

    await editApplication(app, cookie, added.id, applicationDetails({ companyName: "shopee" }));

    expect(await (await getApplication(app, cookie, added.id)).json()).toMatchObject({
      company: added.company,
    });
  });

  it("leaves the Status and the Status history where the Status Changes put them", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie, newApplication({ status: "applied" }));

    await editApplication(app, cookie, added.id, applicationDetails({ roleTitle: "Another" }));

    expect(await (await getApplication(app, cookie, added.id)).json()).toMatchObject({
      status: "applied",
      statusChangedAt: added.statusChangedAt,
      statusChanges: added.statusChanges,
    });
  });

  it("refuses an edit the shared schema rejects, and changes nothing", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie);

    const edited = await editApplication(
      app,
      cookie,
      added.id,
      applicationDetails({ postingLink: "not-a-link" }),
    );

    expect(edited.status).toBe(400);
    await expect((await getApplication(app, cookie, added.id)).json()).resolves.toEqual(added);
  });

  it("answers 404 for an Application that doesn't exist", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const edited = await editApplication(
      app,
      cookie,
      "00000000-0000-4000-8000-000000000000",
      applicationDetails(),
    );

    expect(edited.status).toBe(404);
  });
});

describe("deleting an Application", () => {
  it("removes it for good, taking its Status Changes with it", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie);

    const deleted = await deleteApplication(app, cookie, id);

    // Status Changes reference the Application, so the delete could only succeed by taking
    // them with it; afterwards nothing the API offers can reach the Application at all.
    expect(deleted.status).toBe(204);
    expect((await getApplication(app, cookie, id)).status).toBe(404);
    await expect((await listApplications(app, cookie)).json()).resolves.toEqual([]);
  });

  it("leaves the job seeker's other Applications alone", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const keeping = await addApplicationOrThrow(app, cookie, newApplication({ roleTitle: "Keep" }));
    const going = await addApplicationOrThrow(app, cookie, newApplication({ roleTitle: "Go" }));

    await deleteApplication(app, cookie, going.id);

    expect(await (await listApplications(app, cookie)).json()).toMatchObject([
      { id: keeping.id, roleTitle: "Keep" },
    ]);
  });

  it("leaves none of its Status Changes behind, since deleting is permanent", async () => {
    const databaseUrl = await createTestDatabaseUrl();
    const app = await startApp(databaseUrl);
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie);
    // Nothing the API offers can reach a deleted Application's rows, and there is no archive,
    // so this one test looks straight at the table to see that they really went.
    const sql = postgres(databaseUrl, { max: 1 });

    try {
      const before = await sql`select id from status_changes where application_id = ${id}`;
      expect(before).toHaveLength(1);

      await deleteApplication(app, cookie, id);

      const after = await sql`select id from status_changes where application_id = ${id}`;
      expect(after).toHaveLength(0);
    } finally {
      await sql.end();
    }
  });

  it("answers 404 for an Application that doesn't exist, so a second delete says so", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie);
    await deleteApplication(app, cookie, id);

    expect((await deleteApplication(app, cookie, id)).status).toBe(404);
  });
});
