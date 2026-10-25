import { z } from "zod";
import type { AppConfig } from "./app";

const Environment = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "must be a postgres:// connection string",
  }),
  PORT: z.coerce.number().int().positive().default(3000),
  AUTH_SECRET: z.string({ error: "is required" }).min(32, {
    error: "must be at least 32 characters; generate one with `openssl rand -base64 32`",
  }),
  APP_URL: z
    .url({ protocol: /^https?$/, error: "must be an http:// or https:// address" })
    .transform((url) => new URL(url).origin)
    .optional(),
  INVITE_LIST: z
    .string()
    .optional()
    .transform(
      (list) =>
        list
          ?.split(",")
          .map((email) => email.trim())
          .filter(Boolean) ?? [],
    )
    .pipe(z.array(z.email()))
    .transform((emails) => (emails.length > 0 ? emails : null)),
  EXTRACTION_DAILY_CAP: z.coerce.number().int().nonnegative().default(20),
  WEB_DIST_DIR: z.string().min(1).optional(),
});

export interface Config {
  port: number;
  databaseUrl: string;
  app: Omit<AppConfig, "migrationsFolder">;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

/** Reads configuration from environment variables; see `.env.example` for what each one does. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  // A variable left empty in .env means "not set", so its default applies.
  const nonEmptyEnv = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ""));
  const parsed = Environment.safeParse(nonEmptyEnv);
  if (!parsed.success) {
    throw new ConfigError(`Invalid configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const {
    DATABASE_URL,
    PORT,
    AUTH_SECRET,
    APP_URL,
    INVITE_LIST,
    EXTRACTION_DAILY_CAP,
    WEB_DIST_DIR,
  } = parsed.data;
  return {
    port: PORT,
    databaseUrl: DATABASE_URL,
    app: {
      authSecret: AUTH_SECRET,
      appUrl: APP_URL ?? null,
      inviteList: INVITE_LIST,
      extractionDailyCap: EXTRACTION_DAILY_CAP,
      webDistDir: WEB_DIST_DIR ?? null,
    },
  };
}
