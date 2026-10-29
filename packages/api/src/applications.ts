import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  Application,
  ApplicationDetails,
  ApplicationSummary,
  ErrorMessage,
  latestStatusChange,
  NewApplication,
} from "@job-tracker/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { applications, companies, statusChanges } from "./database/schema";

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

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

/** Matches the user's Company with this name, whatever its letter case. */
export function sameCompanyName(userId: string, name: string) {
  return and(eq(companies.userId, userId), sql`lower(${companies.name}) = lower(${name})`);
}

/**
 * The user's Company with this name, created if they haven't used it before. The unique index
 * on the lower-cased name means an existing Company is reused whatever its letter case, and
 * that two requests adding the same company name at once still end up with one Company.
 */
async function findOrCreateCompany(transaction: Transaction, userId: string, name: string) {
  await transaction.insert(companies).values({ userId, name }).onConflictDoNothing();
  const [company] = await transaction.select().from(companies).where(sameCompanyName(userId, name));
  if (!company) throw new Error(`The Company "${name}" went missing as it was created`);
  return company;
}

/**
 * Points the Application's stored current Status and latest Status Change time at its latest
 * Status Change. Every write to an Application's Status Changes calls this in the same
 * transaction, so the two can never drift apart.
 */
export async function syncCurrentStatus(
  transaction: Transaction,
  applicationId: string,
): Promise<void> {
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

/** The columns an Application's details live in, the same whether it is added or edited. */
function detailValues(companyId: string, details: ApplicationDetails) {
  return {
    companyId,
    roleTitle: details.roleTitle,
    jobDescription: details.jobDescription,
    postingLink: details.postingLink,
    location: details.location,
    pay: details.pay,
    source: details.source,
  };
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
        ...detailValues(company.id, details),
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

/**
 * Rewrites every detail of an Application, moving it to the Company the job seeker named and
 * creating that Company if it is a new one. `false` when the user has no such Application,
 * which also keeps a Company from being created for one that isn't theirs. The Status is left
 * alone: only a Status Change moves it.
 */
async function editApplication(
  database: Database,
  userId: string,
  id: string,
  details: ApplicationDetails,
): Promise<boolean> {
  return database.transaction(async (transaction) => {
    const [existing] = await transaction
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.id, id)));
    if (!existing) return false;
    const company = await findOrCreateCompany(transaction, userId, details.companyName);
    await transaction
      .update(applications)
      .set({ ...detailValues(company.id, details), updatedAt: new Date() })
      // Scoped to the user here too, so this write stays safe on its own.
      .where(and(eq(applications.userId, userId), eq(applications.id, id)));
    return true;
  });
}

/**
 * Deletes an Application. Its Status Changes go with it, which the database does, and there
 * is no archive. `false` when the user has no such Application.
 */
async function deleteApplication(database: Database, userId: string, id: string) {
  const deleted = await database
    .delete(applications)
    .where(and(eq(applications.userId, userId), eq(applications.id, id)))
    .returning({ id: applications.id });
  return deleted.length > 0;
}

/**
 * The user's Applications, latest Status Change first, optionally only those at one Company.
 * Every query is scoped to the signed-in user, so no list can reach another user's data.
 */
export async function listApplications(database: Database, userId: string, companyId?: string) {
  const rows = await database
    .select(summaryColumns)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(
      and(
        eq(applications.userId, userId),
        companyId === undefined ? undefined : eq(applications.companyId, companyId),
      ),
    )
    .orderBy(desc(applications.statusChangedAt));
  return rows.map(withIsoStatusChangedAt);
}

/** `undefined` both for an Application that doesn't exist and for another user's. */
export async function findApplication(database: Database, userId: string, id: string) {
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

// PUT, not PATCH: the body carries every detail, so a detail left out of it is a detail the
// job seeker cleared. The Status is not a detail, which is why it isn't in the body at all.
const edit = createRoute({
  method: "put",
  path: "/applications/{id}",
  summary: "Edit an Application's details",
  description:
    "Replaces every detail at once, creating the Company when the company name is one the user hasn't used. The Application's Status and its Status Changes are untouched.",
  request: {
    params: z.object({ id: z.uuid() }),
    body: { content: { "application/json": { schema: ApplicationDetails } }, required: true },
  },
  responses: {
    200: {
      description: "The Application as it now stands",
      content: { "application/json": { schema: Application } },
    },
    404: {
      description: "No Application of the signed-in user's has this id",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

const remove = createRoute({
  method: "delete",
  path: "/applications/{id}",
  summary: "Delete an Application",
  description:
    "Permanent, and takes the Application's Status Changes with it. There is no archive.",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    204: { description: "The Application is gone" },
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
    })
    .openapi(edit, async (c) => {
      const userId = c.var.user.id;
      const { id } = c.req.valid("param");
      if (!(await editApplication(database, userId, id, c.req.valid("json")))) {
        return c.json({ message: "This Application doesn't exist." }, 404);
      }
      const edited = await findApplication(database, userId, id);
      if (!edited) throw new Error("The Application just edited can't be read back");
      return c.json(edited, 200);
    })
    .openapi(remove, async (c) => {
      const { id } = c.req.valid("param");
      return (await deleteApplication(database, c.var.user.id, id))
        ? c.body(null, 204)
        : c.json({ message: "This Application doesn't exist." }, 404);
    });
}
