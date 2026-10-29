import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Application, ErrorMessage, NewStatusChange, type Status } from "@job-tracker/shared";
import { and, eq } from "drizzle-orm";
import { findApplication, syncCurrentStatus, type Transaction } from "./applications";
import type { SignedIn } from "./auth";
import type { Database } from "./database/database";
import { applications, statusChanges } from "./database/schema";

/** One Status Change, by its Application's id and its own, as the routes' paths name them. */
const statusChangeParams = z.object({ id: z.uuid(), statusChangeId: z.uuid() });
type StatusChangeParams = z.infer<typeof statusChangeParams>;

/**
 * Whether the user has this Application, locking its row until the transaction ends. Every
 * write to an Application's Status Changes starts here, so two at once take turns rather than
 * each deciding on a history the other is changing.
 */
async function lockApplication(transaction: Transaction, userId: string, id: string) {
  const [application] = await transaction
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.id, id)))
    .for("update");
  return application !== undefined;
}

/**
 * Moves an Application to a Status by recording a Status Change for it now. Any Status can
 * follow any other. `false` when the user has no such Application.
 */
async function changeStatus(
  database: Database,
  userId: string,
  id: string,
  status: Status,
): Promise<boolean> {
  return database.transaction(async (transaction) => {
    if (!(await lockApplication(transaction, userId, id))) return false;
    const now = new Date();
    await transaction
      .insert(statusChanges)
      .values({ applicationId: id, status, occurredAt: now, recordedAt: now });
    await syncCurrentStatus(transaction, id);
    return true;
  });
}

/**
 * Corrects which Status a Status Change recorded, keeping when it happened. `false` when the
 * user has no such Application, or it has no such Status Change.
 */
async function editStatusChange(
  database: Database,
  userId: string,
  ids: StatusChangeParams,
  status: Status,
): Promise<boolean> {
  return database.transaction(async (transaction) => {
    if (!(await lockApplication(transaction, userId, ids.id))) return false;
    const edited = await transaction
      .update(statusChanges)
      .set({ status })
      .where(oneStatusChange(ids))
      .returning({ id: statusChanges.id });
    if (edited.length === 0) return false;
    await syncCurrentStatus(transaction, ids.id);
    return true;
  });
}

type DeleteOutcome = "deleted" | "only-one" | "missing";

/**
 * Deletes a mistaken Status Change, and the Application's current Status follows whichever is
 * latest of those remaining. Its only Status Change is never deleted, since an Application
 * always has a Status; the lock on the Application keeps two deletes at once from each
 * leaving the other's as the last one and taking it anyway.
 */
async function deleteStatusChange(
  database: Database,
  userId: string,
  ids: StatusChangeParams,
): Promise<DeleteOutcome> {
  return database.transaction(async (transaction) => {
    if (!(await lockApplication(transaction, userId, ids.id))) return "missing";
    const history = await transaction
      .select({ id: statusChanges.id })
      .from(statusChanges)
      .where(eq(statusChanges.applicationId, ids.id));
    if (!history.some((statusChange) => statusChange.id === ids.statusChangeId)) return "missing";
    if (history.length === 1) return "only-one";
    await transaction.delete(statusChanges).where(oneStatusChange(ids));
    await syncCurrentStatus(transaction, ids.id);
    return "deleted";
  });
}

/** One Status Change, found only under the Application it belongs to. */
function oneStatusChange(ids: StatusChangeParams) {
  return and(eq(statusChanges.applicationId, ids.id), eq(statusChanges.id, ids.statusChangeId));
}

const change = createRoute({
  method: "post",
  path: "/applications/{id}/status-changes",
  summary: "Change an Application's Status",
  description:
    "Records a Status Change to the Status sent, happening now, which makes it the Application's current Status. Any Status can follow any other.",
  request: {
    params: z.object({ id: z.uuid() }),
    body: { content: { "application/json": { schema: NewStatusChange } }, required: true },
  },
  responses: {
    201: {
      description: "The Application in its new Status, with its Status history",
      content: { "application/json": { schema: Application } },
    },
    404: {
      description: "No Application of the signed-in user's has this id",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

const edit = createRoute({
  method: "put",
  path: "/applications/{id}/status-changes/{statusChangeId}",
  summary: "Correct which Status a Status Change recorded",
  description:
    "Keeps when the Status Change happened. The Application's current Status follows its latest Status Change, so it changes only when that is the one corrected.",
  request: {
    params: statusChangeParams,
    body: { content: { "application/json": { schema: NewStatusChange } }, required: true },
  },
  responses: {
    200: {
      description: "The Application with its corrected Status history",
      content: { "application/json": { schema: Application } },
    },
    404: {
      description: "No Application of the signed-in user's has this id, or no such Status Change",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

const remove = createRoute({
  method: "delete",
  path: "/applications/{id}/status-changes/{statusChangeId}",
  summary: "Delete a mistaken Status Change",
  description:
    "The Application's current Status follows the latest Status Change remaining. Its only Status Change can't be deleted.",
  request: { params: statusChangeParams },
  responses: {
    200: {
      description: "The Application with what remains of its Status history",
      content: { "application/json": { schema: Application } },
    },
    404: {
      description: "No Application of the signed-in user's has this id, or no such Status Change",
      content: { "application/json": { schema: ErrorMessage } },
    },
    409: {
      description: "This is the Application's only Status Change",
      content: { "application/json": { schema: ErrorMessage } },
    },
  },
});

export function statusChangeRoutes(database: Database) {
  return new OpenAPIHono<SignedIn>()
    .openapi(change, async (c) => {
      const userId = c.var.user.id;
      const { id } = c.req.valid("param");
      if (!(await changeStatus(database, userId, id, c.req.valid("json").status))) {
        return c.json({ message: "This Application doesn't exist." }, 404);
      }
      const changed = await findApplication(database, userId, id);
      if (!changed) throw new Error("The Application whose Status just changed can't be read back");
      return c.json(changed, 201);
    })
    .openapi(edit, async (c) => {
      const userId = c.var.user.id;
      const ids = c.req.valid("param");
      if (!(await editStatusChange(database, userId, ids, c.req.valid("json").status))) {
        return c.json({ message: "This Status Change doesn't exist." }, 404);
      }
      const edited = await findApplication(database, userId, ids.id);
      if (!edited) throw new Error("The Application just corrected can't be read back");
      return c.json(edited, 200);
    })
    .openapi(remove, async (c) => {
      const userId = c.var.user.id;
      const ids = c.req.valid("param");
      switch (await deleteStatusChange(database, userId, ids)) {
        case "missing":
          return c.json({ message: "This Status Change doesn't exist." }, 404);
        case "only-one":
          return c.json(
            { message: "An Application always keeps at least one Status Change." },
            409,
          );
        case "deleted": {
          const remaining = await findApplication(database, userId, ids.id);
          if (!remaining) throw new Error("The Application just corrected can't be read back");
          return c.json(remaining, 200);
        }
      }
    });
}
