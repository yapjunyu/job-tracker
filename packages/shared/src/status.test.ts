import { describe, expect, it } from "vitest";
import { isFinalStatus, type Status } from "./status";

describe("isFinalStatus", () => {
  it.each<[Status, boolean]>([
    ["saved", false],
    ["applied", false],
    ["assessment", false],
    ["interviewing", false],
    ["offer", false],
    ["accepted", true],
    ["declined", true],
    ["rejected", true],
    ["withdrawn", true],
  ])("an Application in %s has reached a final Status: %s", (status, final) => {
    expect(isFinalStatus(status)).toBe(final);
  });
});
