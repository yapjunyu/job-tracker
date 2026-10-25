import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { Database } from "./database";

export class UpdateRequiredError extends Error {
  constructor() {
    super(
      "Update required: this database has been migrated by a newer version of job-tracker. " +
        "Update this copy to the latest version, then start it again.",
    );
    this.name = "UpdateRequiredError";
  }
}

/**
 * Applies the migrations in `migrationsFolder` that the database hasn't had yet. Records them
 * in Drizzle's own `drizzle.__drizzle_migrations` table, so `drizzle-kit` stays compatible.
 */
export async function migrateDatabase(database: Database, migrationsFolder: string): Promise<void> {
  const migrations = readMigrationFiles({ migrationsFolder });
  const latestKnown = Math.max(0, ...migrations.map((migration) => migration.folderMillis));

  await database.transaction(async (tx) => {
    // Instances that start together queue here, and each one after the first finds nothing
    // left to apply. A transaction-level lock is released on commit or rollback, and holds
    // even through a transaction-mode connection pooler such as Neon's.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('job-tracker migrations'))`);
    await tx.execute(sql`create schema if not exists drizzle`);
    await tx.execute(sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `);
    const [lastApplied] = await tx.execute<{ created_at: string }>(
      sql`select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
    );
    const lastAppliedAt = lastApplied ? Number(lastApplied.created_at) : 0;
    if (lastAppliedAt > latestKnown) {
      throw new UpdateRequiredError();
    }

    for (const migration of migrations) {
      if (migration.folderMillis <= lastAppliedAt) continue;
      for (const statement of migration.sql) {
        await tx.execute(sql.raw(statement));
      }
      await tx.execute(
        sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.folderMillis})`,
      );
    }
  });
}
