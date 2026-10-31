import type { Status } from "./status";

/**
 * The Statuses an Application is waiting on the Company in, and so the only ones Ghosted
 * applies to. Saved is the job seeker's own to act on, Offer and the final Statuses have
 * already had their answer.
 */
export const ghostableStatuses = [
  "applied",
  "assessment",
  "interviewing",
] as const satisfies readonly Status[];

const ghostableStatusSet: ReadonlySet<Status> = new Set(ghostableStatuses);

/** What the Ghosted rule needs of an Application: where it stands and when it last moved. */
export interface GhostedCandidate {
  status: Status;
  /** When its latest Status Change happened. */
  statusChangedAt: Date;
}

const msPerDay = 24 * 60 * 60 * 1000;

/**
 * The moment a latest Status Change has to be before for its silence to count as Ghosted:
 * the threshold's days back from `now`. The table's Ghosted filter asks the database for
 * Applications whose latest Status Change is before this, so the filter and the label on each
 * row can't come to different answers.
 */
export function ghostedBefore(thresholdDays: number, now: Date): Date {
  return new Date(now.getTime() - thresholdDays * msPerDay);
}

/**
 * Whether an Application has gone quiet: it is waiting on the Company and its latest Status
 * Change is older than the threshold. On the threshold day itself it is not yet Ghosted, so a
 * threshold of 30 days labels an Application on the thirty-first day of silence.
 *
 * Ghosted is never stored. It is worked out wherever an Application is shown, from `now`,
 * which is passed in so the same reading holds across a request and can be tested.
 */
export function isGhosted(
  application: GhostedCandidate,
  thresholdDays: number,
  now: Date,
): boolean {
  return (
    ghostableStatusSet.has(application.status) &&
    application.statusChangedAt.getTime() < ghostedBefore(thresholdDays, now).getTime()
  );
}
