import { z } from "zod";

/** Days of silence before Ghosted applies, until a job seeker sets their own. */
export const defaultGhostedThresholdDays = 30;

/**
 * How many days of silence count as Ghosted. A day at the least, since a threshold of none
 * would label every Application the moment it was added, and a year at the most, by which
 * point no hiring process is still open.
 */
export const GhostedThresholdDays = z.int().min(1).max(365);

/** A job seeker's own settings, which is the Ghosted threshold and nothing else yet. */
export const UserSettings = z
  .object({ ghostedThresholdDays: GhostedThresholdDays })
  .meta({ id: "UserSettings" });
export type UserSettings = z.infer<typeof UserSettings>;
