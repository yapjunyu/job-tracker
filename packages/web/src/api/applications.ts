import {
  Application,
  ApplicationListParams,
  applicationListQuery,
  ApplicationSummary,
  isFiltered,
  type ApplicationDetails,
  type NewApplication,
} from "@job-tracker/shared";
import {
  keepPreviousData,
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { applicationsKey, companiesKey } from "@/api/query-keys";
import { failureMessage } from "@/api/failure-message";

/**
 * A row of the table. A row still on its way to the server is marked `pending`: there is no
 * Application behind its id yet, so nothing may follow it to a detail page.
 */
export type ApplicationRow = ApplicationSummary & { pending?: boolean };

/**
 * What every table query's key starts with. The rows the table shows depend on what it asked
 * for, so each set of list parameters is its own query, and a change to an Application has to
 * reach all of them.
 */
const applicationsListKey = [...applicationsKey, "list"] as const;

const everyTableQuery = { queryKey: applicationsListKey } as const;

/**
 * The table's rows as the list parameters ask for them. Sorting, filtering and search all
 * happen in the API, so a change to any of them is a new query rather than work in here.
 */
export function applicationsQuery(params: ApplicationListParams) {
  const query = applicationListQuery(params);
  return queryOptions({
    queryKey: [...applicationsListKey, query],
    queryFn: async (): Promise<ApplicationRow[]> => {
      const response = await fetch(query ? `/api/applications?${query}` : "/api/applications");
      if (!response.ok) {
        throw new Error(await failureMessage(response, "Your Applications couldn't be loaded."));
      }
      return ApplicationSummary.array().parse(await response.json());
    },
    // The rows on screen stay up while the next ones load, so sorting the table or typing a
    // search never empties it.
    placeholderData: keepPreviousData,
  });
}

/** What the table queries hold now, so a change the server rejects can be put back. */
export type TableRowsBefore = [readonly unknown[], ApplicationRow[] | undefined][];

/**
 * Stops every table query still loading, so none of their answers lands over the change
 * about to be made, and hands back what each holds now.
 */
export async function holdTableQueries(queryClient: QueryClient): Promise<TableRowsBefore> {
  await queryClient.cancelQueries(everyTableQuery);
  return queryClient.getQueriesData<ApplicationRow[]>(everyTableQuery);
}

/** Puts every table query back as `holdTableQueries` found it. */
export function restoreTableQueries(queryClient: QueryClient, before: TableRowsBefore) {
  for (const [queryKey, rows] of before) queryClient.setQueryData(queryKey, rows);
}

/** Shows a change on every set of rows the table has loaded, however each was asked for. */
export function updateTableRows(
  queryClient: QueryClient,
  change: (rows: ApplicationRow[]) => ApplicationRow[],
) {
  queryClient.setQueriesData<ApplicationRow[]>(everyTableQuery, (rows) => rows && change(rows));
}

/** The list parameters a table query asked for, which its key carries as a query string. */
function paramsOf(queryKey: readonly unknown[]): ApplicationListParams | undefined {
  const query = queryKey[applicationsListKey.length];
  if (typeof query !== "string") return undefined;
  const asked = ApplicationListParams.safeParse(
    Object.fromEntries(new URLSearchParams(query).entries()),
  );
  return asked.success ? asked.data : undefined;
}

/**
 * Refetches the table and everything about Companies. Adding, editing or deleting an
 * Application can create a Company or change which Applications a Company view lists, and
 * renaming a Company changes the name every Application at it shows.
 */
export function invalidateApplicationsAndCompanies(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: applicationsKey }),
    queryClient.invalidateQueries({ queryKey: companiesKey }),
  ]);
}

/** One Application with its Status history, or `null` when the job seeker has no such one. */
export function applicationQuery(id: string) {
  return queryOptions({
    queryKey: [...applicationsKey, id],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(await failureMessage(response, "This Application couldn't be loaded."));
      }
      return Application.parse(await response.json());
    },
  });
}

/** Stands in for the new Application in the table until the server answers with the real one. */
function asPendingRow(details: NewApplication): ApplicationRow {
  return {
    pending: true,
    id: crypto.randomUUID(),
    roleTitle: details.roleTitle,
    company: { id: crypto.randomUUID(), name: details.companyName },
    status: details.status,
    source: details.source,
    statusChangedAt: new Date().toISOString(),
  };
}

/**
 * Adds an Application. The row shows the moment the job seeker saves it, and is taken back
 * out, with a message saying why, if the server rejects it.
 */
export function useAddApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: NewApplication) => {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (!response.ok) {
        throw new Error(
          await failureMessage(response, "The server wouldn't accept this Application."),
        );
      }
      return Application.parse(await response.json());
    },
    onMutate: async (details) => {
      // Stops a list already on its way back from overwriting the row just added.
      const previous = await holdTableQueries(queryClient);
      const pending = asPendingRow(details);
      // At the top of the tables showing everything, since it is the newest Status Change
      // there is. A table narrowed down is the API's answer to a question this row may be no
      // part of, so there it waits for the refetch rather than flashing in and out.
      for (const [queryKey, rows] of queryClient.getQueriesData<ApplicationRow[]>(
        everyTableQuery,
      )) {
        const params = paramsOf(queryKey);
        if (rows && params && !isFiltered(params)) {
          queryClient.setQueryData(queryKey, [pending, ...rows]);
        }
      }
      return { previous };
    },
    onError: (error, _details, context) => {
      if (context) restoreTableQueries(queryClient, context.previous);
      toast.error("That Application wasn't added.", { description: error.message });
    },
    onSettled: () => invalidateApplicationsAndCompanies(queryClient),
  });
}

/** The details a table row shows, so an edit lands on the table as well as the detail page. */
function withSummaryDetails<Row extends ApplicationSummary>(
  row: Row,
  details: ApplicationDetails,
): Row {
  return {
    ...row,
    roleTitle: details.roleTitle,
    // A company name the job seeker hasn't used becomes a new Company, whose id only the
    // server knows. The name is what's on screen; the refetch brings the id.
    company: { ...row.company, name: details.companyName },
    source: details.source,
  };
}

/** Every detail the edit changed, on screen before the server has answered. */
function withDetails(application: Application, details: ApplicationDetails): Application {
  return {
    ...withSummaryDetails(application, details),
    postingLink: details.postingLink,
    location: details.location,
    pay: details.pay,
    jobDescription: details.jobDescription,
  };
}

/**
 * Edits an Application's details. The detail page and the table row both show the change at
 * once, and both go back to what they held, with a message saying why, if the server rejects
 * it. The Status is left alone; only a Status Change moves it.
 */
export function useEditApplication(id: string) {
  const queryClient = useQueryClient();
  const detailKey = applicationQuery(id).queryKey;

  return useMutation({
    mutationFn: async (details: ApplicationDetails) => {
      const response = await fetch(`/api/applications/${id}`, {
        // PUT, because the form sends every detail: one the job seeker cleared is sent as
        // `null`, not left out.
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (!response.ok) {
        throw new Error(await failureMessage(response, "The server wouldn't accept this change."));
      }
      return Application.parse(await response.json());
    },
    onMutate: async (details) => {
      // Stops answers already on their way back from overwriting the edit just made.
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = {
        application: queryClient.getQueryData(detailKey),
        rows: await holdTableQueries(queryClient),
      };
      queryClient.setQueryData(detailKey, (application) =>
        application ? withDetails(application, details) : application,
      );
      updateTableRows(queryClient, (rows) =>
        rows.map((row) => (row.id === id ? withSummaryDetails(row, details) : row)),
      );
      return previous;
    },
    onError: (error, _details, context) => {
      if (context) {
        queryClient.setQueryData(detailKey, context.application);
        restoreTableQueries(queryClient, context.rows);
      }
      toast.error("That change wasn't saved.", { description: error.message });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        invalidateApplicationsAndCompanies(queryClient),
      ]);
    },
  });
}

/**
 * Deletes an Application for good, along with its Status Changes. The row goes the moment the
 * job seeker confirms, and comes back, with a message saying why, if the server rejects it.
 */
export function useDeleteApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(
          await failureMessage(response, "The server wouldn't delete this Application."),
        );
      }
    },
    onMutate: async () => {
      const previous = await holdTableQueries(queryClient);
      updateTableRows(queryClient, (rows) => rows.filter((row) => row.id !== id));
      return { previous };
    },
    onSuccess: () => {
      // Nothing can be loaded for it any more, so asking again would only answer 404.
      queryClient.removeQueries({ queryKey: applicationQuery(id).queryKey });
    },
    onError: (error, _variables, context) => {
      if (context) restoreTableQueries(queryClient, context.previous);
      toast.error("That Application wasn't deleted.", { description: error.message });
    },
    onSettled: () => invalidateApplicationsAndCompanies(queryClient),
  });
}
