import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    postgresUrl: string;
  }
}

/** One Postgres container per test run; each test creates its own database inside it. */
export default async function startPostgres(project: TestProject) {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  project.provide("postgresUrl", container.getConnectionUri());
  return async () => {
    await container.stop();
  };
}
