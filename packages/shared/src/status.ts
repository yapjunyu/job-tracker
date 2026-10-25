import { z } from "zod";

/** Where an Application currently stands. Any Status can follow any other. */
export const Status = z.enum([
  "saved",
  "applied",
  "assessment",
  "interviewing",
  "offer",
  "accepted",
  "declined",
  "rejected",
  "withdrawn",
]);
export type Status = z.infer<typeof Status>;

const finalStatuses: ReadonlySet<Status> = new Set([
  "accepted",
  "declined",
  "rejected",
  "withdrawn",
]);

/** An Application in a final Status is no longer active, and a Round never moves it. */
export function isFinalStatus(status: Status): boolean {
  return finalStatuses.has(status);
}
