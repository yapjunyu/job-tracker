import { describe, expect, it } from "vitest";
import { isFinalStatus, latestStatusChange, type Status, type StatusChangeTiming } from "./status";

describe("final Statuses", () => {
  it.each<Status>(["accepted", "declined", "rejected", "withdrawn"])(
    "an Application in %s has reached a final Status",
    (status) => {
      expect(isFinalStatus(status)).toBe(true);
    },
  );

  it.each<Status>(["saved", "applied", "assessment", "interviewing", "offer"])(
    "an Application in %s is still active",
    (status) => {
      expect(isFinalStatus(status)).toBe(false);
    },
  );
});

describe("the current Status", () => {
  const change = (status: Status, occurredAt: string, recordedAt = occurredAt) => ({
    status,
    occurredAt: new Date(occurredAt),
    recordedAt: new Date(recordedAt),
  });

  it("an Application with one Status Change is in that Status", () => {
    const saved = change("saved", "2026-03-01T09:00:00Z");

    expect(latestStatusChange([saved])).toBe(saved);
  });

  it("an Application is in the Status of its latest Status Change by when it happened", () => {
    const applied = change("applied", "2026-03-05T09:00:00Z");
    const statusChanges = [
      change("saved", "2026-03-01T09:00:00Z"),
      applied,
      change("assessment", "2026-03-03T09:00:00Z"),
    ];

    expect(latestStatusChange(statusChanges)).toBe(applied);
  });

  it("breaks a tie between Status Changes that happened at the same moment by when each was recorded", () => {
    const correction = change("rejected", "2026-03-05T09:00:00Z", "2026-03-06T10:00:00Z");
    const statusChanges = [
      correction,
      change("offer", "2026-03-05T09:00:00Z", "2026-03-05T09:00:00Z"),
    ];

    expect(latestStatusChange(statusChanges)).toBe(correction);
  });

  it("an Application with no Status Changes has no current Status", () => {
    const noStatusChanges: StatusChangeTiming[] = [];

    expect(latestStatusChange(noStatusChanges)).toBeUndefined();
  });
});
