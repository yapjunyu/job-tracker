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

/** The Statuses an Application has finished in, which the table's active-only view hides. */
export const finalStatuses = [
  "accepted",
  "declined",
  "rejected",
  "withdrawn",
] as const satisfies readonly Status[];

const finalStatusSet: ReadonlySet<Status> = new Set(finalStatuses);

/** An Application in a final Status is no longer active, and a Round never moves it. */
export function isFinalStatus(status: Status): boolean {
  return finalStatusSet.has(status);
}

/** What the current-Status rule needs of a Status Change. */
export interface StatusChangeTiming {
  status: Status;
  /** When the Application moved to this Status. */
  occurredAt: Date;
  /** When the move was written down. In v1 this always equals `occurredAt`. */
  recordedAt: Date;
}

/**
 * The Status Change that sets an Application's current Status: the latest by when it happened,
 * with ties broken by when it was recorded. `undefined` only for an Application with no Status
 * Changes, which the API never allows one to reach.
 */
export function latestStatusChange<T extends StatusChangeTiming>(
  statusChanges: readonly T[],
): T | undefined {
  return statusChanges.reduce<T | undefined>(
    (latest, change) =>
      latest === undefined ||
      change.occurredAt.getTime() > latest.occurredAt.getTime() ||
      (change.occurredAt.getTime() === latest.occurredAt.getTime() &&
        change.recordedAt.getTime() > latest.recordedAt.getTime())
        ? change
        : latest,
    undefined,
  );
}
