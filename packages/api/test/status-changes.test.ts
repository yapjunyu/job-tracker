import type { Status } from "@job-tracker/shared";
import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import {
  addApplicationOrThrow,
  getApplication,
  listApplications,
  newApplication,
} from "./applications";
import {
  changeStatus,
  changeStatusOrThrow,
  deleteStatusChange,
  editStatusChange,
  newestStatusChange,
} from "./status-changes";
import { startTestApp } from "./test-app";

describe("changing an Application's Status", () => {
  it("records a Status Change and moves the Application to its Status", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie, newApplication({ status: "saved" }));

    const changed = await changeStatus(app, cookie, id, "applied");

    expect(changed.status).toBe(201);
    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      status: "applied",
      statusChanges: [{ status: "applied" }, { status: "saved" }],
    });
  });

  it.each<[Status, Status]>([
    ["saved", "declined"],
    ["rejected", "interviewing"],
    ["accepted", "saved"],
    ["withdrawn", "offer"],
  ])("lets %s move straight to %s, since any Status can follow any other", async (from, to) => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie);
    await changeStatus(app, cookie, id, from);

    const changed = await changeStatus(app, cookie, id, to);

    expect(changed.status).toBe(201);
    expect(await changed.json()).toMatchObject({ status: to });
  });

  it("shows the new Status in the table, with the Application now the latest changed", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const older = await addApplicationOrThrow(app, cookie, newApplication({ roleTitle: "Older" }));
    await addApplicationOrThrow(app, cookie, newApplication({ roleTitle: "Newer" }));

    await changeStatus(app, cookie, older.id, "interviewing");

    expect(await (await listApplications(app, cookie)).json()).toMatchObject([
      { roleTitle: "Older", status: "interviewing" },
      { roleTitle: "Newer", status: "saved" },
    ]);
  });

  it("refuses a Status that isn't one of the nine", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie);

    const changed = await changeStatus(app, cookie, added.id, "ghosted");

    expect(changed.status).toBe(400);
    await expect((await getApplication(app, cookie, added.id)).json()).resolves.toEqual(added);
  });

  it("answers 404 for another job seeker's Application, and leaves it alone", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const theirApplication = await addApplicationOrThrow(app, theirs);

    const changed = await changeStatus(app, mine, theirApplication.id, "rejected");

    expect(changed.status).toBe(404);
    await expect((await getApplication(app, theirs, theirApplication.id)).json()).resolves.toEqual(
      theirApplication,
    );
  });
});

describe("editing a Status Change", () => {
  it("records a different Status, and the current Status follows the latest", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, cookie, newApplication({ status: "applied" }));
    const changed = await changeStatusOrThrow(app, cookie, id, "rejected");
    const mistake = newestStatusChange(changed);

    const edited = await editStatusChange(app, cookie, id, mistake.id, "interviewing");

    expect(edited.status).toBe(200);
    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      status: "interviewing",
      statusChangedAt: mistake.occurredAt,
      statusChanges: [
        { id: mistake.id, status: "interviewing", occurredAt: mistake.occurredAt },
        { status: "applied" },
      ],
    });
  });

  it("leaves the current Status alone when the Status Change corrected isn't the latest", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie, newApplication({ status: "saved" }));
    await changeStatusOrThrow(app, cookie, added.id, "assessment");
    const first = newestStatusChange(added);

    await editStatusChange(app, cookie, added.id, first.id, "applied");

    expect(await (await getApplication(app, cookie, added.id)).json()).toMatchObject({
      status: "assessment",
      statusChanges: [{ status: "assessment" }, { status: "applied" }],
    });
  });

  it("answers 404 for a Status Change of another of the job seeker's Applications", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const one = await addApplicationOrThrow(app, cookie);
    const other = await addApplicationOrThrow(app, cookie);

    const edited = await editStatusChange(
      app,
      cookie,
      one.id,
      newestStatusChange(other).id,
      "rejected",
    );

    expect(edited.status).toBe(404);
    await expect((await getApplication(app, cookie, other.id)).json()).resolves.toEqual(other);
  });

  it("answers 404 for another job seeker's Status Change, and leaves it alone", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const theirApplication = await addApplicationOrThrow(app, theirs);

    const edited = await editStatusChange(
      app,
      mine,
      theirApplication.id,
      newestStatusChange(theirApplication).id,
      "rejected",
    );

    expect(edited.status).toBe(404);
    await expect((await getApplication(app, theirs, theirApplication.id)).json()).resolves.toEqual(
      theirApplication,
    );
  });
});

describe("deleting a Status Change", () => {
  it("puts the Application back in the Status of the latest one remaining", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie, newApplication({ status: "applied" }));
    const changed = await changeStatusOrThrow(app, cookie, added.id, "offer");
    const mistake = newestStatusChange(changed);

    const deleted = await deleteStatusChange(app, cookie, added.id, mistake.id);

    expect(deleted.status).toBe(200);
    expect(await (await getApplication(app, cookie, added.id)).json()).toMatchObject({
      status: "applied",
      statusChangedAt: added.statusChangedAt,
      statusChanges: [{ status: "applied" }],
    });
  });

  it("leaves the current Status alone when the Status Change deleted isn't the latest", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie, newApplication({ status: "saved" }));
    await changeStatusOrThrow(app, cookie, added.id, "applied");

    await deleteStatusChange(app, cookie, added.id, newestStatusChange(added).id);

    expect(await (await getApplication(app, cookie, added.id)).json()).toMatchObject({
      status: "applied",
      statusChanges: [{ status: "applied" }],
    });
  });

  it("refuses to delete an Application's only Status Change, which it can't be without", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const added = await addApplicationOrThrow(app, cookie);

    const deleted = await deleteStatusChange(app, cookie, added.id, newestStatusChange(added).id);

    expect(deleted.status).toBe(409);
    expect(await deleted.json()).toEqual({
      message: "An Application always keeps at least one Status Change.",
    });
    await expect((await getApplication(app, cookie, added.id)).json()).resolves.toEqual(added);
  });

  it("answers 404 for another job seeker's Status Change, and leaves it alone", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const { id } = await addApplicationOrThrow(app, theirs);
    const theirApplication = await changeStatusOrThrow(app, theirs, id, "applied");

    const deleted = await deleteStatusChange(
      app,
      mine,
      theirApplication.id,
      newestStatusChange(theirApplication).id,
    );

    expect(deleted.status).toBe(404);
    await expect((await getApplication(app, theirs, theirApplication.id)).json()).resolves.toEqual(
      theirApplication,
    );
  });
});
