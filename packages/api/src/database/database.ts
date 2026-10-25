import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabase(url: string) {
  // Notices such as "schema already exists, skipping" are informational, not worth logging.
  const client = postgres(url, { onnotice: () => undefined });
  return drizzle({ client, schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDatabase>;
