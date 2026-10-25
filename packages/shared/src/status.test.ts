import { describe, expect, it } from "vitest";
import { isFinalStatus, type Status } from "./status";

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
