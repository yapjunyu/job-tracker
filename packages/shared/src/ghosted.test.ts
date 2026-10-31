import { describe, expect, it } from "vitest";
import { isGhosted } from "./ghosted";
import { defaultGhostedThresholdDays } from "./settings";
import type { Status } from "./status";

const now = new Date("2026-03-31T09:00:00Z");

/** An Application in this Status whose latest Status Change was this many days before `now`. */
function quietFor(days: number, status: Status = "applied") {
  const statusChangedAt = new Date(now);
  statusChangedAt.setUTCDate(statusChangedAt.getUTCDate() - days);
  return { status, statusChangedAt };
}

describe("the Ghosted rule", () => {
  it("labels an Application that has been quiet for longer than the threshold", () => {
    expect(isGhosted(quietFor(45), 30, now)).toBe(true);
  });

  it("leaves an Application quiet for fewer days than the threshold alone", () => {
    expect(isGhosted(quietFor(29), 30, now)).toBe(false);
  });

  it("doesn't label an Application on the threshold day itself, which is not yet silence", () => {
    expect(isGhosted(quietFor(30), 30, now)).toBe(false);
  });

  it("labels it the day after the threshold", () => {
    expect(isGhosted(quietFor(31), 30, now)).toBe(true);
  });

  it("follows the threshold the job seeker set, not the default", () => {
    expect(isGhosted(quietFor(10), 7, now)).toBe(true);
    expect(isGhosted(quietFor(10), 60, now)).toBe(false);
  });

  it.each<Status>(["applied", "assessment", "interviewing"])(
    "can label an Application in %s, where the Company has gone quiet",
    (status) => {
      expect(isGhosted(quietFor(45, status), defaultGhostedThresholdDays, now)).toBe(true);
    },
  );

  it.each<Status>(["saved", "offer", "accepted", "declined", "rejected", "withdrawn"])(
    "never labels an Application in %s, however long ago it last moved",
    (status) => {
      expect(isGhosted(quietFor(400, status), defaultGhostedThresholdDays, now)).toBe(false);
    },
  );

  it("is 30 days of silence until the job seeker says otherwise", () => {
    expect(defaultGhostedThresholdDays).toBe(30);
  });
});
