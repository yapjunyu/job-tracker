// Drizzle table definitions. Tables arrive with the tickets that need them; run
// `pnpm --filter @job-tracker/api db:generate` after changing this file.
// Migrations are additive only: never rename or drop a table or column.
import { defaultGhostedThresholdDays, Source, Status } from "@job-tracker/shared";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

// Better Auth's tables. Its Drizzle adapter finds each table by its model name made plural,
// and each column by Better Auth's own field name, so those names must stay as they are.

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

/** How a user signs in: a password for email sign-in, or a link to a Google account. */
export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text().notNull(),
    accountId: text().notNull(),
    password: text(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index().on(table.identifier)],
);

// Drizzle wants a non-empty tuple of the allowed values; Zod gives the same values as an array.
const statusValues = Status.options as [Status, ...Status[]];
const sourceValues = Source.options as [Source, ...Source[]];

/** The index that keeps a user's Company names unique ignoring case. */
export const companyNameUniqueIndex = "companies_user_id_lower_name_unique";

export const companies = pgTable(
  "companies",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    ...timestamps,
  },
  (table) => [
    // One Company per name per user, so "shopee" and "Shopee" never become two.
    uniqueIndex(companyNameUniqueIndex).on(table.userId, sql`lower(${table.name})`),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    roleTitle: text().notNull(),
    jobDescription: text(),
    postingLink: text(),
    location: text(),
    pay: text(),
    source: text({ enum: sourceValues }),
    // The current Status and the time of the latest Status Change, for sorting and filtering.
    // Both follow the Application's Status Changes, written in the same transaction as every
    // Status Change; see `syncCurrentStatus`.
    currentStatus: text({ enum: statusValues }).notNull(),
    statusChangedAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index().on(table.userId)],
);

/**
 * A user's own settings, one row per user, written the first time they change anything. A user
 * with no row has the defaults, so signing up writes nothing here.
 */
export const userSettings = pgTable("user_settings", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Days of silence before an Application shows the Ghosted label. */
  ghostedThresholdDays: integer().notNull().default(defaultGhostedThresholdDays),
  ...timestamps,
});

/** An Application's history. Deleting the Application takes its Status Changes with it. */
export const statusChanges = pgTable(
  "status_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    status: text({ enum: statusValues }).notNull(),
    /** When the Application moved to this Status. */
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    /** When the move was written down, which is also when this row was created. */
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.applicationId)],
);
