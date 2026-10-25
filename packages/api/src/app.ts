import { OpenAPIHono } from "@hono/zod-openapi";
import type { LanguageModel } from "ai";
import type { Database } from "./database/database";
import { migrateDatabase } from "./database/migrations";
import { healthRoutes } from "./health";
import { webApp } from "./web-app";

export interface AppConfig {
  /** Email addresses allowed to sign up. `null` leaves sign-up open, the self-hosted default. */
  inviteList: readonly string[] | null;
  /** How many AI extractions each user may run per day. */
  extractionDailyCap: number;
  /** Folder of Drizzle migrations this build knows about. */
  migrationsFolder: string;
  /** Built web app to serve from the same origin. `null` serves only the API, as in development. */
  webDistDir: string | null;
}

export interface AppDependencies {
  database: Database;
  /** `null` when no AI provider is configured, which makes extraction unavailable. */
  languageModel: LanguageModel | null;
}

/**
 * Builds the whole app. Production, tests and end-to-end runs all start the app through here.
 * Migrates the database first, so an app that exists always has the schema it expects.
 */
export async function createApp(config: AppConfig, dependencies: AppDependencies) {
  await migrateDatabase(dependencies.database, config.migrationsFolder);

  const app = new OpenAPIHono().route("/api", healthRoutes);
  app.doc31("/api/openapi.json", {
    openapi: "3.1.0",
    info: { title: "job-tracker API", version: "0.0.0" },
  });

  if (config.webDistDir) {
    app.route("/", webApp(config.webDistDir));
  }

  return app;
}
