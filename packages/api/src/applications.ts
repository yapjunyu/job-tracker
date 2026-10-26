import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  Application,
  ApplicationSummary,
  ErrorMessage,
  latestStatusChange,
  NewApplication,
} from "@job-tracker/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { applications, companies, statusChanges } from "./database/schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const summaryColumns = {
  id: applications.id,
  roleTitle: applications.roleTitle,
  status: applications.currentStatus,
  source: applications.source,
  statusChangedAt: applications.statusChangedAt,
  company: { id: companies.id, name: companies.name },
};

const detailColumns = {
  ...summaryColumns,
  postingLink: applications.postingLink,
  location: applications.location,
  pay: applications.pay,
  jobDescription: applications.jobDescription,
};

function withIsoStatusChangedAt<Row extends { statusChangedAt: Date }>(row: Row) {
  return { ...row, statusChangedAt: row.statusChangedAt.toISOString() };
}

/**
 * The user's Company with this name, created if they haven't used it before. The unique index
 * on the lower-cased name means an existing Company is reused whatever its letter case, and
 * that two requests adding the same company name at once still end up with one Company.
 */
async function findOrCreateCompany(transaction: Transaction, userId: string, name: string) {
  const sameName = and(
    eq(companies.userId, userId),
    sql`lower(${companies.name}) = lower(${name})`,
  );
  await transaction.insert(companies).values({ userId, name }).onConflictDoNothing();
  const [company] = await transaction.select().from(companies).where(sameName);
  if (!company) throw new Error(`The Company "${name}" went missing as it was created`);
  return company;
}

/**
 * Points the Application's stored current Status and latest Status Change time at its latest
 * Status Change. Every write to an Application's Status Changes calls this in the same
 * transaction, so the two can never drift apart.
 */
async function syncCurrentStatus(transaction: Transaction, applicationId: string): Promise<void> {
  const history = await transaction
    .select({
      status: statusChanges.status,
      occurredAt: statusChanges.occurredAt,
      recordedAt: statusChanges.recordedAt,
    })
    .from(statusChanges)
    .where(eq(statusChanges.applicationId, applicationId));
  const latest = latestStatusChange(history);
  if (!latest) throw new Error("An Application always keeps at least one Status Change");
  await transaction
    .update(applications)
    .set({
      currentStatus: latest.status,
      statusChangedAt: latest.occurredAt,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
}

/** Adds an Application, its Company if it is a new one, and its first Status Change. */
async function addApplication(
  database: Database,
  userId: string,
  details: NewApplication,
): Promise<string> {
  return database.transaction(async (transaction) => {
    const company = await findOrCreateCompany(transaction, userId, details.companyName);
    const now = new Date();
    const [added] = await transaction
      .insert(applications)
      .values({
        userId,
        companyId: company.id,
        roleTitle: details.roleTitle,
        jobDescription: details.jobDescription,
        postingLink: details.postingLink,
        location: details.location,
        pay: details.pay,
        source: details.source,
        // Both columns are NOT NULL, so the insert seeds them; `syncCurrentStatus` below
        // is what makes them true, and stays the only place that decides what they hold.
        currentStatus: details.status,
        statusChangedAt: now,
      })
      .returning({ id: applications.id });
    if (!added) throw new Error("Adding the Application returned no row");
    await transaction.insert(statusChanges).values({
      applicationId: added.id,
      status: details.status,
      occurredAt: now,
      recordedAt: now,
    });
    await syncCurrentStatus(transaction, added.id);
    return added.id;
  });
}

/** Every query is scoped to the signed-in user, so no list can reach another user's data. */
async function listApplications(database: Database, userId: string) {
  const rows = await database
    .select(summaryColumns)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.statusChangedAt));
  return rows.map(withIsoStatusChangedAt);
}

/** `undefined` both for an Application that doesn't exist and for another user's. */
async function findApplication(database: Database, userId: string, id: string) {
  const [row] = await database
    .select(detailColumns)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(eq(applications.userId, userId), eq(applications.id, id)));
  if (!row) return undefined;
  const history = await database
    .select({
      id: statusChanges.id,
      status: statusChanges.status,
      occurredAt: statusChanges.occurredAt,
      recordedAt: statusChanges.recordedAt,
    })
    .from(statusChanges)
    .where(eq(statusChanges.applicationId, id))
    .orderBy(desc(statusChanges.occurredAt), desc(statusChanges.recordedAt));
  return {
    ...withIsoStatusChangedAt(row),
    statusChanges: history.map((change) => ({
      ...change,
      occurredAt: change.occurredAt.toISOString(),
      recordedAt: change.recordedAt.toISOString(),
    })),
  };
}

const list = createRoute({
  method: "get",
  path: "/applications",
  summary: "List the signed-in user's Applications",
  description: "The table's rows, latest Status Change first.",
  responses: {
    200: {
      description: "Every Application the signed-in user has",
      content: { "application/json": { schema: z.array(ApplicationSummary) } },
    },
  },
});

const add = createRoute({
  method: "post",
  path: "/applications",
  summary: "Add an Application",
  description:
    "Creates the Company when the company name is one the user hasn't used, matching ignoring case, and records the Application's first Status Change.",
  request: {
    body: { content: { "application/json": { schema: NewApplication } }, required: true },
  },
  responses: {
    201: {
      description: "The Application that was added",
      content: { "application/json": { schema: Application } },
    },
  },
});

const get = createRoute({
  method: "get",
  path: "/applications/{id}",
  summary: "Get one Application with its Status history",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: "The Application",
      content: { "application/json": { schema: Application } },
    },
    404: {
      description: "No Application of the signed-in user's has this id",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

export function applicationRoutes(database: Database) {
  return new OpenAPIHono<SignedIn>()
    .openapi(list, async (c) => c.json(await listApplications(database, c.var.user.id), 200))
    .openapi(add, async (c) => {
      const userId = c.var.user.id;
      const id = await addApplication(database, userId, c.req.valid("json"));
      const added = await findApplication(database, userId, id);
      if (!added) throw new Error("The Application just added can't be read back");
      return c.json(added, 201);
    })
    .openapi(get, async (c) => {
      const found = await findApplication(database, c.var.user.id, c.req.valid("param").id);
      return found
        ? c.json(found, 200)
        : c.json({ message: "This Application doesn't exist." }, 404);
    });
}
