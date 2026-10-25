import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { inject, onTestFinished } from "vitest";
import { createApp, type AppConfig, type AppDependencies } from "../src/app";
import { createDatabase } from "../src/database/database";

export interface TestAppOverrides {
  config?: Partial<AppConfig>;
  languageModel?: AppDependencies["languageModel"];
}

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

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
  onTestFinished(() => database.$client.end());
  return createApp(
    {
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
