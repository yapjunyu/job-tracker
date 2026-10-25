import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onTestFinished } from "vitest";

export interface Migration {
  tag: string;
  /** Drizzle orders migrations by this timestamp. */
  when: number;
  sql: string;
}

/** Writes migrations in the layout `drizzle-kit generate` produces, standing in for a build of the app. */
export async function writeMigrationsFolder(migrations: Migration[]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "job-tracker-migrations-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));

  await mkdir(join(folder, "meta"));
  const journal = {
    version: "7",
    dialect: "postgresql",
    entries: migrations.map(({ tag, when }, idx) => ({
      idx,
      version: "7",
      when,
      tag,
      breakpoints: true,
    })),
  };
  await writeFile(join(folder, "meta", "_journal.json"), JSON.stringify(journal));
  for (const { tag, sql } of migrations) {
    await writeFile(join(folder, `${tag}.sql`), sql);
  }
  return folder;
}
