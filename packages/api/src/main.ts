import { serve } from "@hono/node-server";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { ConfigError, loadConfig } from "./config";
import { createDatabase } from "./database/database";
import { UpdateRequiredError } from "./database/migrations";

// Resolved from this file, which sits one level below the package root both as
// src/main.ts in development and as dist/main.js once built.
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

async function main() {
  const config = loadConfig(process.env);
  const database = createDatabase(config.databaseUrl);

  try {
    const app = await createApp(
      { ...config.app, migrationsFolder },
      { database, languageModel: null },
    );
    const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
      console.log(`job-tracker is listening on http://localhost:${port}`);
    });

    // Cloud Run sends SIGTERM before it stops an instance, as does `docker compose down`.
    const shutDown = () => {
      server.close(() => void database.$client.end());
    };
    process.once("SIGTERM", shutDown);
    process.once("SIGINT", shutDown);
  } catch (error) {
    await database.$client.end();
    throw error;
  }
}

main().catch((error: unknown) => {
  const expected = error instanceof ConfigError || error instanceof UpdateRequiredError;
  console.error(expected ? error.message : error);
  process.exit(1);
});
