import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  Company,
  CompanyRename,
  CompanyWithApplications,
  defaultApplicationListParams,
  ErrorMessage,
} from "@job-tracker/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import { listApplications, sameCompanyName } from "./applications";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { companies, companyNameUniqueIndex } from "./database/schema";

const companyColumns = { id: companies.id, name: companies.name };

/**
 * The user's Companies whose names contain `search`, ignoring case, in name order. `strpos`
 * rather than `like`, so a `%` or `_` the job seeker types is matched as itself.
 */
async function searchCompanies(database: Database, userId: string, search: string) {
  return database
    .select(companyColumns)
    .from(companies)
    .where(
      and(
        eq(companies.userId, userId),
        sql`strpos(lower(${companies.name}), lower(${search})) > 0`,
      ),
    )
    .orderBy(asc(sql`lower(${companies.name})`));
}

/** `undefined` both for a Company that doesn't exist and for another user's. */
async function findCompany(database: Database, userId: string, id: string) {
  const [company] = await database
    .select(companyColumns)
    .from(companies)
    .where(and(eq(companies.userId, userId), eq(companies.id, id)));
  if (!company) return undefined;
  // A Company view is the user's whole history with that employer, so it keeps the
  // Applications that have finished rather than hiding them as the table does.
  const applications = await listApplications(database, userId, {
    ...defaultApplicationListParams,
    company: [id],
    activeOnly: false,
  });
  return { ...company, applications };
}

/** Whether `error` is Postgres refusing a second Company with the same name for one user. */
function isCompanyNameTaken(error: unknown): boolean {
  // Drizzle wraps the driver's error, which carries Postgres's code and the index's name.
  const cause: unknown = error instanceof Error ? error.cause : undefined;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "23505" &&
    "constraint_name" in cause &&
    cause.constraint_name === companyNameUniqueIndex
  );
}

type RenameOutcome =
  | { outcome: "renamed"; company: Company }
  | { outcome: "taken"; existingName: string }
  | { outcome: "missing" };

/**
 * Gives a Company a new name. The unique index decides whether another of the user's
 * Companies already has the name ignoring case, so two renames at once can't both win it;
 * changing only the letter case of the Company's own name is never a clash.
 */
async function renameCompany(
  database: Database,
  userId: string,
  id: string,
  name: string,
): Promise<RenameOutcome> {
  try {
    const [renamed] = await database
      .update(companies)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(companies.userId, userId), eq(companies.id, id)))
      .returning(companyColumns);
    return renamed ? { outcome: "renamed", company: renamed } : { outcome: "missing" };
  } catch (error) {
    if (!isCompanyNameTaken(error)) throw error;
    const [existing] = await database
      .select({ name: companies.name })
      .from(companies)
      .where(sameCompanyName(userId, name));
    // It may be renamed in the moment between; the name asked for still explains the clash.
    return { outcome: "taken", existingName: existing?.name ?? name };
  }
}

const list = createRoute({
  method: "get",
  path: "/companies",
  summary: "List the signed-in user's Companies",
  description:
    "Suggestions for the company name field: the Companies whose names contain `search`, ignoring case, in name order. Without `search`, every Company.",
  request: { query: z.object({ search: z.string().default("") }) },
  responses: {
    200: {
      description: "The matching Companies",
      content: { "application/json": { schema: z.array(Company) } },
    },
  },
});

const get = createRoute({
  method: "get",
  path: "/companies/{id}",
  summary: "Get one Company with its Applications",
  description: "Every Application the user has made at the Company, latest Status Change first.",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: "The Company",
      content: { "application/json": { schema: CompanyWithApplications } },
    },
    404: {
      description: "No Company of the signed-in user's has this id",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

const rename = createRoute({
  method: "put",
  path: "/companies/{id}",
  summary: "Rename a Company",
  description: "Every Application at the Company shows the new name.",
  request: {
    params: z.object({ id: z.uuid() }),
    body: { content: { "application/json": { schema: CompanyRename } }, required: true },
  },
  responses: {
    200: {
      description: "The Company with its new name",
      content: { "application/json": { schema: Company } },
    },
    404: {
      description: "No Company of the signed-in user's has this id",
      content: { "application/json": { schema: ErrorMessage } },
    },
    409: {
      description: "Another of the user's Companies already has this name, ignoring case",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

export function companyRoutes(database: Database) {
  return new OpenAPIHono<SignedIn>()
    .openapi(list, async (c) =>
      c.json(await searchCompanies(database, c.var.user.id, c.req.valid("query").search), 200),
    )
    .openapi(get, async (c) => {
      const found = await findCompany(database, c.var.user.id, c.req.valid("param").id);
      return found ? c.json(found, 200) : c.json({ message: "This Company doesn't exist." }, 404);
    })
    .openapi(rename, async (c) => {
      const { id } = c.req.valid("param");
      const { name } = c.req.valid("json");
      const renamed = await renameCompany(database, c.var.user.id, id, name);
      switch (renamed.outcome) {
        case "renamed":
          return c.json(renamed.company, 200);
        case "taken":
          return c.json(
            { message: `You already have a Company called "${renamed.existingName}".` },
            409,
          );
        case "missing":
          return c.json({ message: "This Company doesn't exist." }, 404);
      }
    });
}
