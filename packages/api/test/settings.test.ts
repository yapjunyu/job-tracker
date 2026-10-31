import { defaultGhostedThresholdDays } from "@job-tracker/shared";
import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import { getSettings, saveSettings, setGhostedThresholdOrThrow } from "./settings";
import { startTestApp } from "./test-app";

describe("a job seeker's settings", () => {
  it("starts at 30 days of silence for someone who has never changed it", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const settings = await getSettings(app, cookie);

    expect(settings.status).toBe(200);
    expect(await settings.json()).toEqual({
      ghostedThresholdDays: defaultGhostedThresholdDays,
    });
  });

  it("answers later reads with the threshold the job seeker set", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const saved = await setGhostedThresholdOrThrow(app, cookie, 14);

    expect(saved).toEqual({ ghostedThresholdDays: 14 });
    expect(await (await getSettings(app, cookie)).json()).toEqual({ ghostedThresholdDays: 14 });
  });

  it("keeps the latest of several changes", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    await setGhostedThresholdOrThrow(app, cookie, 14);
    await setGhostedThresholdOrThrow(app, cookie, 45);

    expect(await (await getSettings(app, cookie)).json()).toEqual({ ghostedThresholdDays: 45 });
  });

  it("is each job seeker's own", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);

    await setGhostedThresholdOrThrow(app, mine, 7);

    expect(await (await getSettings(app, theirs)).json()).toEqual({
      ghostedThresholdDays: defaultGhostedThresholdDays,
    });
  });

  it.each([0, -1, 366, 10.5, "30"])("refuses %p as a threshold", async (days) => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const refused = await saveSettings(app, cookie, { ghostedThresholdDays: days });

    expect(refused.status).toBe(400);
    expect(await (await getSettings(app, cookie)).json()).toEqual({
      ghostedThresholdDays: defaultGhostedThresholdDays,
    });
  });

  it("answers 401 to anyone not signed in", async () => {
    const app = await startTestApp();

    expect((await getSettings(app, "")).status).toBe(401);
  });
});
