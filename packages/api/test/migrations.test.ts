import { describe, expect, it } from "vitest";
import { writeMigrationsFolder, type Migration } from "./migrations-folder";
import { createTestDatabaseUrl, startApp } from "./test-app";

const createCompanies: Migration = {
  tag: "0000_create_companies",
  when: 1_700_000_000_000,
  sql: "create table companies (id integer primary key);",
};
const createApplications: Migration = {
  tag: "0001_create_applications",
  when: 1_700_000_100_000,
  sql: "create table applications (id integer primary key);",
};

describe("migrations at startup", () => {
  it("refuses to start with an update required message when the database has migrations newer than the app knows", async () => {
    const databaseUrl = await createTestDatabaseUrl();
    const newerBuild = await writeMigrationsFolder([createCompanies, createApplications]);
    const olderBuild = await writeMigrationsFolder([createCompanies]);
    await startApp(databaseUrl, { config: { migrationsFolder: newerBuild } });

    await expect(
      startApp(databaseUrl, { config: { migrationsFolder: olderBuild } }),
    ).rejects.toThrow(/update required/i);
  });

  it("runs the migrations once when two instances start together", async () => {
    const databaseUrl = await createTestDatabaseUrl();
    // The sleep keeps the first instance mid-migration while the second starts. Running
    // `create table` a second time would fail, so both starting means it ran once.
    const build = await writeMigrationsFolder([
      {
        ...createCompanies,
        sql: `select pg_sleep(1);\n--> statement-breakpoint\n${createCompanies.sql}`,
      },
    ]);

    const instances = await Promise.all([
      startApp(databaseUrl, { config: { migrationsFolder: build } }),
      startApp(databaseUrl, { config: { migrationsFolder: build } }),
    ]);

    for (const app of instances) {
      expect((await app.request("/api/health")).status).toBe(200);
    }
  });

  it("starts again against a database it has already migrated", async () => {
    const databaseUrl = await createTestDatabaseUrl();
    const build = await writeMigrationsFolder([createCompanies, createApplications]);
    await startApp(databaseUrl, { config: { migrationsFolder: build } });

    const app = await startApp(databaseUrl, { config: { migrationsFolder: build } });

    expect((await app.request("/api/health")).status).toBe(200);
  });
});
