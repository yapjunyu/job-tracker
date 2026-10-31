import {
  applicationListQuery,
  type ApplicationListParams,
  defaultApplicationListParams,
} from "@job-tracker/shared";
import { describe, expect, it } from "vitest";
import type { Database } from "../src/database/database";
import { signUpSomeone } from "./accounts";
import {
  addApplicationOrThrow,
  getApplication,
  listApplications,
  newApplication,
} from "./applications";
import { goQuietFor } from "./ghosted";
import { setGhostedThresholdOrThrow } from "./settings";
import { changeStatusOrThrow } from "./status-changes";
import { startTestAppWithDatabase, type TestApp } from "./test-app";

/** The role titles the table answers with, and whether each one is labelled Ghosted. */
async function labels(app: TestApp, cookie: string, params: Partial<ApplicationListParams> = {}) {
  const response = await listApplications(
    app,
    cookie,
    applicationListQuery({ ...defaultApplicationListParams, ...params }),
  );
  if (response.status !== 200) throw new Error(`Listing failed with ${response.status}`);
  const rows = (await response.json()) as { roleTitle: string; ghosted: boolean }[];
  return Object.fromEntries(rows.map((row) => [row.roleTitle, row.ghosted]));
}

/**
 * A job search with two Applications nobody has answered for 45 days and one applied for
 * this morning.
 */
async function aSearchWithSilence(app: TestApp, database: Database) {
  const cookie = await signUpSomeone(app);
  const quiet = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({ roleTitle: "Quiet Intern", status: "applied" }),
  );
  const interviewing = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({ roleTitle: "Interviewing Intern", status: "applied" }),
  );
  await changeStatusOrThrow(app, cookie, interviewing.id, "interviewing");
  const fresh = await addApplicationOrThrow(
    app,
    cookie,
    newApplication({ roleTitle: "Fresh Intern", status: "applied" }),
  );
  await goQuietFor(database, quiet.id, 45);
  await goQuietFor(database, interviewing.id, 45);
  return { cookie, quiet, interviewing, fresh };
}

describe("the Ghosted label", () => {
  it("is on the Applications nobody has answered for longer than the threshold", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie } = await aSearchWithSilence(app, database);

    expect(await labels(app, cookie)).toEqual({
      "Quiet Intern": true,
      "Interviewing Intern": true,
      "Fresh Intern": false,
    });
  });

  it("is on the Application's own page as well as its row", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie, quiet, fresh } = await aSearchWithSilence(app, database);

    expect(await (await getApplication(app, cookie, quiet.id)).json()).toMatchObject({
      ghosted: true,
    });
    expect(await (await getApplication(app, cookie, fresh.id)).json()).toMatchObject({
      ghosted: false,
    });
  });

  it("goes as soon as a new Status Change is recorded", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie, quiet } = await aSearchWithSilence(app, database);

    const changed = await changeStatusOrThrow(app, cookie, quiet.id, "interviewing");

    expect(changed).toMatchObject({ ghosted: false });
    expect(await labels(app, cookie)).toMatchObject({ "Quiet Intern": false });
  });

  it("follows the threshold the job seeker set, without anything being written again", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie } = await aSearchWithSilence(app, database);

    await setGhostedThresholdOrThrow(app, cookie, 60);

    expect(await labels(app, cookie)).toMatchObject({ "Quiet Intern": false });

    await setGhostedThresholdOrThrow(app, cookie, 7);

    expect(await labels(app, cookie)).toMatchObject({ "Quiet Intern": true });
  });

  it("is never on an Application the job seeker is the one to act on", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const cookie = await signUpSomeone(app);
    const saved = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Saved Intern", status: "saved" }),
    );
    await goQuietFor(database, saved.id, 400);

    expect(await labels(app, cookie)).toEqual({ "Saved Intern": false });
  });

  it("is never on an Application that has had its answer", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const cookie = await signUpSomeone(app);
    const rejected = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Rejected Intern", status: "applied" }),
    );
    await changeStatusOrThrow(app, cookie, rejected.id, "rejected");
    await goQuietFor(database, rejected.id, 400);

    // Finished Applications are hidden until asked for, and are not Ghosted when they are.
    expect(await labels(app, cookie, { activeOnly: false })).toEqual({
      "Rejected Intern": false,
    });
  });
});

describe("the Ghosted filter", () => {
  it("narrows the table to the Applications that have gone quiet", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie } = await aSearchWithSilence(app, database);

    expect(await labels(app, cookie, { ghosted: true })).toEqual({
      "Quiet Intern": true,
      "Interviewing Intern": true,
    });
  });

  it("narrows it to the Applications that have not, the other way round", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie } = await aSearchWithSilence(app, database);

    expect(await labels(app, cookie, { ghosted: false })).toEqual({ "Fresh Intern": false });
  });

  it("combines with the other filters rather than replacing them", async () => {
    const { app, database } = await startTestAppWithDatabase();
    const { cookie, quiet } = await aSearchWithSilence(app, database);

    const rows = await listApplications(
      app,
      cookie,
      applicationListQuery({
        ...defaultApplicationListParams,
        ghosted: true,
        status: ["applied"],
      }),
    );

    expect(await rows.json()).toMatchObject([{ id: quiet.id }]);
  });
});
