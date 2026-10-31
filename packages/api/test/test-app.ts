import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { inject, onTestFinished } from "vitest";
import { createApp, type AppConfig, type AppDependencies } from "../src/app";
import { closeDatabase, createDatabase } from "../src/database/database";

export interface TestAppOverrides {
  config?: Partial<AppConfig>;
  languageModel?: AppDependencies["languageModel"];
}

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const authSecret = randomBytes(32).toString("base64");

/** A new, empty database in the shared Postgres container, so no test sees another's data. */
export async function createTestDatabaseUrl(): Promise<string> {
  const adminUrl = inject("postgresUrl");
  const name = `test_${randomUUID().replaceAll("-", "")}`;
  const admin = postgres(adminUrl, { max: 1 });
  try {
    await admin.unsafe(`create database "${name}"`);
  } finally {
    await admin.end();
  }
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

/** Starts the app through the same factory production uses, against the given database. */
export async function startApp(databaseUrl: string, overrides: TestAppOverrides = {}) {
  const database = createDatabase(databaseUrl);
  onTestFinished(() => closeDatabase(database));
  return createApp(
    {
      authSecret,
      appUrl: null,
      inviteList: null,
      extractionDailyCap: 20,
      migrationsFolder,
      webDistDir: null,
      ...overrides.config,
    },
    { database, languageModel: overrides.languageModel ?? null },
  );
}

/** Starts the app against a fresh database. */
export async function startTestApp(overrides: TestAppOverrides = {}) {
  return startApp(await createTestDatabaseUrl(), overrides);
}

export type TestApp = Awaited<ReturnType<typeof startApp>>;

/**
 * The app and a connection to the database behind it, for a test that has to seed something no
 * request can ask for, such as an Application that has been quiet for weeks.
 */
export async function startTestAppWithDatabase(overrides: TestAppOverrides = {}) {
  const databaseUrl = await createTestDatabaseUrl();
  const app = await startApp(databaseUrl, overrides);
  const database = createDatabase(databaseUrl);
  onTestFinished(() => closeDatabase(database));
  return { app, database };
}
