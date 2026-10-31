import { eq } from "drizzle-orm";
import type { Database } from "../src/database/database";
import { applications, statusChanges } from "../src/database/schema";

const msPerDay = 24 * 60 * 60 * 1000;

/**
 * This many days ago, worked out here rather than with the rule under test, so a test that
 * seeds silence can still disagree with the rule that reads it.
 */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * msPerDay);
}

/**
 * Makes an Application as quiet as one nobody has answered for this many days: its Status
 * Changes are moved into the past, and so is the latest-Status-Change time that follows them.
 * Written straight to the database, since no request can record a Status Change in the past.
 */
export async function goQuietFor(database: Database, applicationId: string, days: number) {
  const when = daysAgo(days);
  await database
    .update(statusChanges)
    .set({ occurredAt: when, recordedAt: when })
    .where(eq(statusChanges.applicationId, applicationId));
  await database
    .update(applications)
    .set({ statusChangedAt: when })
    .where(eq(applications.id, applicationId));
}
