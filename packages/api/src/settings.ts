import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { defaultGhostedThresholdDays, UserSettings } from "@job-tracker/shared";
import { eq } from "drizzle-orm";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { userSettings } from "./database/schema";

/**
 * The user's settings, which are the defaults until they change one: a user who has never
 * been to the Settings page has no row of their own, and signing up writes none.
 */
export async function findSettings(database: Database, userId: string): Promise<UserSettings> {
  const [settings] = await database
    .select({ ghostedThresholdDays: userSettings.ghostedThresholdDays })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings ?? { ghostedThresholdDays: defaultGhostedThresholdDays };
}

/** Writes the user's settings, creating their row the first time they change anything. */
async function saveSettings(
  database: Database,
  userId: string,
  settings: UserSettings,
): Promise<UserSettings> {
  await database
    .insert(userSettings)
    .values({ userId, ...settings })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...settings, updatedAt: new Date() },
    });
  return settings;
}

const read = createRoute({
  method: "get",
  path: "/settings",
  summary: "Get the signed-in user's settings",
  description:
    "The settings as they stand, which are the defaults for a user who has never changed one.",
  responses: {
    200: {
      description: "The user's settings",
      content: { "application/json": { schema: UserSettings } },
    },
  },
});

// PUT, not PATCH: the body carries every setting, as the Settings page sends them.
const save = createRoute({
  method: "put",
  path: "/settings",
  summary: "Change the signed-in user's settings",
  description:
    "Takes effect on the next read of an Application: a Ghosted threshold is never stored on an Application, so changing it relabels them all at once.",
  request: {
    body: { content: { "application/json": { schema: UserSettings } }, required: true },
  },
  responses: {
    200: {
      description: "The settings as they now stand",
      content: { "application/json": { schema: UserSettings } },
    },
  },
});

export function settingsRoutes(database: Database) {
  return new OpenAPIHono<SignedIn>()
    .openapi(read, async (c) => c.json(await findSettings(database, c.var.user.id), 200))
    .openapi(save, async (c) =>
      c.json(await saveSettings(database, c.var.user.id, c.req.valid("json")), 200),
    );
}
