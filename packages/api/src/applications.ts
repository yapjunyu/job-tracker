import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  Application,
  ApplicationDetails,
  ApplicationListParams,
  type ApplicationSort,
  ApplicationSummary,
  ErrorMessage,
  finalStatuses,
  ghostableStatuses,
  ghostedBefore,
  isGhosted,
  latestStatusChange,
  NewApplication,
  Source,
  Status,
} from "@job-tracker/shared";
import { and, desc, eq, inArray, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { applications, companies, statusChanges } from "./database/schema";
import { findSettings } from "./settings";

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

/**
 * The Ghosted rule as one request reads it: this job seeker's Ghosted threshold, and the
 * moment the request is answered. Ghosted is never stored, so every read works it out, and
 * reading the rule once a request keeps every Application in one answer on one moment.
 */
interface GhostedRule {
  thresholdDays: number;
  now: Date;
}

async function ghostedRuleFor(database: Database, userId: string): Promise<GhostedRule> {
  const { ghostedThresholdDays } = await findSettings(database, userId);
  return { thresholdDays: ghostedThresholdDays, now: new Date() };
}

/** The Ghosted label, by the same rule the browser labels an unanswered change with. */
function withGhosted<Row extends { status: Status; statusChangedAt: Date }>(
  row: Row,
  rule: GhostedRule,
) {
  return { ...row, ghosted: isGhosted(row, rule.thresholdDays, rule.now) };
}

function withIsoStatusChangedAt<Row extends { statusChangedAt: Date }>(row: Row) {
  return { ...row, statusChangedAt: row.statusChangedAt.toISOString() };
}

/**
 * The Ghosted rule as the database asks it: waiting on the Company, and quiet since before the
 * threshold. The moment comes from the same `ghostedBefore` the label goes through, so the
 * Ghosted filter can't disagree with the labels on the rows it answers with.
 */
function hasGoneQuiet(rule: GhostedRule): SQL {
  const waitingOnTheCompany = inArray(applications.currentStatus, [...ghostableStatuses]);
  // `lt` rather than a `<` written out, so the moment reaches the database as the column's
  // own kind of time rather than as a Date the driver has no idea what to do with.
  const quietSince = lt(applications.statusChangedAt, ghostedBefore(rule.thresholdDays, rule.now));
  return sql`(${waitingOnTheCompany} and ${quietSince})`;
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
 * Where a value sits in its own list, as a number to sort by. Sorting by Status then follows
 * the order an Application moves through them, and sorting by Source follows GLOSSARY.md,
 * rather than either going by name: Saved before Offer, not Accepted before Saved. The index
 * is written into the query itself, since it comes from our own list and not from a request.
 */
function listOrder(column: AnyPgColumn, values: readonly string[]): SQL {
  const cases = values.map(
    (value, index) => sql`when ${column} = ${value} then ${sql.raw(String(index))}`,
  );
  return sql`case ${sql.join(cases, sql` `)} end`;
}

/** What each column the table sorts by is in the query, so the database does the sorting. */
const sortExpressions: Record<ApplicationSort, SQL> = {
  roleTitle: sql`lower(${applications.roleTitle})`,
  company: sql`lower(${companies.name})`,
  status: listOrder(applications.currentStatus, Status.options),
  source: listOrder(applications.source, Source.options),
  statusChangedAt: sql`${applications.statusChangedAt}`,
};

function orderBy(params: ApplicationListParams): SQL[] {
  const direction = sql.raw(params.direction);
  return [
    // Nulls last either way round, so Applications missing the column sorted by never lead.
    sql`${sortExpressions[params.sort]} ${direction} nulls last`,
    // Rows alike in that column keep an order of their own, the same on every request.
    sql`${applications.statusChangedAt} desc`,
    sql`${applications.id} asc`,
  ];
}

/**
 * Everything the list parameters ask of an Application, on top of it being this user's.
 * Filters combine: an Application has to match all of them, the active-only view included.
 * Asking for a final Status is what `filteredByStatus` turns active-only off for.
 */
function conditionsFor(params: ApplicationListParams, rule: GhostedRule): (SQL | undefined)[] {
  return [
    params.status.length > 0 ? inArray(applications.currentStatus, params.status) : undefined,
    params.activeOnly ? notInArray(applications.currentStatus, [...finalStatuses]) : undefined,
    params.source.length > 0 ? inArray(applications.source, params.source) : undefined,
    params.company.length > 0 ? inArray(applications.companyId, params.company) : undefined,
    // Ghosted is worked out rather than stored, so the filter is the rule itself, in the query.
    params.ghosted === null
      ? undefined
      : params.ghosted
        ? hasGoneQuiet(rule)
        : sql`not ${hasGoneQuiet(rule)}`,
    // `strpos` rather than `like`, so a `%` or `_` the job seeker types is matched as itself.
    params.search
      ? or(
          sql`strpos(lower(${applications.roleTitle}), lower(${params.search})) > 0`,
          sql`strpos(lower(${companies.name}), lower(${params.search})) > 0`,
        )
      : undefined,
  ];
}

/**
 * The user's Applications as the list parameters ask for them: filtered, searched and sorted
 * here rather than in the browser, so the table shows the same rows at any size of search.
 * Every query is scoped to the signed-in user, so no list can reach another user's data.
 */
export async function listApplications(
  database: Database,
  userId: string,
  params: ApplicationListParams,
) {
  const rule = await ghostedRuleFor(database, userId);
  const rows = await database
    .select(summaryColumns)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(eq(applications.userId, userId), ...conditionsFor(params, rule)))
    .orderBy(...orderBy(params));
  return rows.map((row) => withIsoStatusChangedAt(withGhosted(row, rule)));
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
    ...withIsoStatusChangedAt(withGhosted(row, await ghostedRuleFor(database, userId))),
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
  description:
    "The table's rows. Sorting, filtering and search all happen here, so the table only asks: a filter given several values is one comma-separated parameter, as in `status=applied,interviewing`, and filters combine. Asked nothing, it answers with every active Application, latest Status Change first; `activeOnly=false` includes those in a final Status. Filters combine, so a Status filter and the active-only view narrow each other.",
  request: { query: ApplicationListParams },
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
    .openapi(list, async (c) =>
      c.json(await listApplications(database, c.var.user.id, c.req.valid("query")), 200),
    )
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
