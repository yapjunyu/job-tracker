import { OpenAPIHono } from "@hono/zod-openapi";
import type { LanguageModel } from "ai";
import { createAuth } from "./auth";
import type { Database } from "./database/database";
import { migrateDatabase } from "./database/migrations";
import { healthRoutes } from "./health";
import { meRoutes } from "./me";
import { webApp } from "./web-app";

export interface AppConfig {
  /** Signs and encrypts session cookies. Changing it signs everyone out. */
  authSecret: string;
  /**
   * The address people open the app at, such as `https://jobs.example.com`. `null` takes it
   * from each request, which works when nothing between the browser and the app changes it.
   */
  appUrl: string | null;
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
  const auth = createAuth(config, dependencies.database);

  const app = new OpenAPIHono().route("/api", healthRoutes).route("/api/auth", auth.routes);
  app.doc31("/api/openapi.json", {
    openapi: "3.1.0",
    info: { title: "job-tracker API", version: "0.0.0" },
  });

  // Every API route from here on is for a signed-in user only; public ones go above. A route
  // answers the first request it matches, so the routes above never reach this check.
  app.use("/api/*", auth.requireSignIn);
  app.route("/api", meRoutes);

  if (config.webDistDir) {
    app.route("/", webApp(config.webDistDir));
  }

  return app;
}
