import {
  Application,
  type ApplicationSummary,
  type CompanyWithApplications,
  latestStatusChange,
  type Status,
  type StatusChange,
} from "@job-tracker/shared";
import { type Query, type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  applicationQuery,
  applicationsQuery,
  invalidateApplicationsAndCompanies,
} from "@/api/applications";
import { failureMessage } from "@/api/failure-message";
import { applicationsKey, companiesKey } from "@/api/query-keys";

// Changing a Status, or editing or deleting a Status Change, shows the moment the job seeker
// does it, everywhere the Application shows:
// its table row, its row in a Company view and its own page. If the server then rejects it,
// every one of them goes back to what it held and a toast says why.

/** Shared by every Status Change mutation, so each can tell whether another is still running. */
const statusChangesKey = ["status-changes"] as const;

const queriesShowingApplications = [applicationsKey, companiesKey];

/** A Company view's query, as opposed to the suggestions, which share the start of its key. */
function isOneCompany(query: Query) {
  return query.queryKey.length === companiesKey.length + 1 && typeof query.queryKey[1] === "string";
}

/**
 * Stops every refetch of a query that shows Applications, so none lands over the change about
 * to be made, and returns what each holds now so a failed change can put it back.
 */
async function holdApplicationQueries(queryClient: QueryClient) {
  await Promise.all(
    queriesShowingApplications.map((queryKey) => queryClient.cancelQueries({ queryKey })),
  );
  return queriesShowingApplications.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
}

function restoreQueries(
  queryClient: QueryClient,
  previous: Awaited<ReturnType<typeof holdApplicationQueries>>,
) {
  for (const [queryKey, data] of previous) queryClient.setQueryData(queryKey, data);
}

/** Shows an Application's new current Status on its row in the table and in its Company view. */
function showStatusOnRows(
  queryClient: QueryClient,
  id: string,
  current: Pick<ApplicationSummary, "status" | "statusChangedAt">,
) {
  const withCurrent = <Row extends ApplicationSummary>(row: Row): Row =>
    row.id === id ? { ...row, ...current } : row;
  queryClient.setQueryData(applicationsQuery.queryKey, (rows) => rows?.map(withCurrent));
  queryClient.setQueriesData<CompanyWithApplications | null>(
    { queryKey: companiesKey, predicate: isOneCompany },
    (company) => company && { ...company, applications: company.applications.map(withCurrent) },
  );
}

/** The Application with this Status history, in the Status its latest Status Change sets. */
function withHistory(application: Application, statusChanges: StatusChange[]): Application {
  const latest = latestStatusChange(
    statusChanges.map((change) => ({
      ...change,
      occurredAt: new Date(change.occurredAt),
      recordedAt: new Date(change.recordedAt),
    })),
  );
  return {
    ...application,
    statusChanges,
    // An Application never has no Status Changes; the server refuses the delete that would
    // leave it none, so until it does the Status stays where it was.
    status: latest?.status ?? application.status,
    statusChangedAt: latest?.occurredAt.toISOString() ?? application.statusChangedAt,
  };
}

/** Shows a change to an Application's Status history on its page and on each of its rows. */
function showHistory(
  queryClient: QueryClient,
  id: string,
  change: (statusChanges: StatusChange[]) => StatusChange[],
) {
  const detailKey = applicationQuery(id).queryKey;
  const application = queryClient.getQueryData(detailKey);
  if (!application) return;
  const changed = withHistory(application, change(application.statusChanges));
  queryClient.setQueryData(detailKey, changed);
  showStatusOnRows(queryClient, id, changed);
}

/**
 * Refetches once the last of the Status Change mutations still running settles, so the answer
 * to one change never lands over another the job seeker has just made.
 */
async function refetchWhenSettled(queryClient: QueryClient) {
  if (queryClient.isMutating({ mutationKey: statusChangesKey }) === 1) {
    await invalidateApplicationsAndCompanies(queryClient);
  }
}

/** Sends a write to an Application's Status Changes, answering with the Application after it. */
async function sendStatusChange(
  path: string,
  request: { method: "POST" | "PUT" | "DELETE"; status?: Status },
  fallback: string,
) {
  const response = await fetch(path, {
    method: request.method,
    ...(request.status && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: request.status }),
    }),
  });
  if (!response.ok) throw new Error(await failureMessage(response, fallback));
  return Application.parse(await response.json());
}

/** Moves an Application to a Status in one action, recording a Status Change for it. */
export function useChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: statusChangesKey,
    mutationFn: ({ applicationId, status }: { applicationId: string; status: Status }) =>
      sendStatusChange(
        `/api/applications/${applicationId}/status-changes`,
        { method: "POST", status },
        "The server wouldn't accept this Status.",
      ),
    onMutate: async ({ applicationId, status }) => {
      const previous = await holdApplicationQueries(queryClient);
      const now = new Date().toISOString();
      showStatusOnRows(queryClient, applicationId, { status, statusChangedAt: now });
      showHistory(queryClient, applicationId, (statusChanges) => [
        // Its id is only a key for the list until the server answers with the real one.
        { id: crypto.randomUUID(), status, occurredAt: now, recordedAt: now },
        ...statusChanges,
      ]);
      return previous;
    },
    onError: (error, _variables, previous) => {
      if (previous) restoreQueries(queryClient, previous);
      toast.error("That Status wasn't changed.", { description: error.message });
    },
    onSettled: () => refetchWhenSettled(queryClient),
  });
}

/** Corrects which Status one of an Application's Status Changes recorded. */
export function useEditStatusChange(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: statusChangesKey,
    mutationFn: ({ statusChangeId, status }: { statusChangeId: string; status: Status }) =>
      sendStatusChange(
        `/api/applications/${applicationId}/status-changes/${statusChangeId}`,
        { method: "PUT", status },
        "The server wouldn't accept this correction.",
      ),
    onMutate: async ({ statusChangeId, status }) => {
      const previous = await holdApplicationQueries(queryClient);
      showHistory(queryClient, applicationId, (statusChanges) =>
        statusChanges.map((change) =>
          change.id === statusChangeId ? { ...change, status } : change,
        ),
      );
      return previous;
    },
    onError: (error, _variables, previous) => {
      if (previous) restoreQueries(queryClient, previous);
      toast.error("That Status Change wasn't corrected.", { description: error.message });
    },
    onSettled: () => refetchWhenSettled(queryClient),
  });
}

/** Deletes a mistaken Status Change. The server refuses to delete an Application's only one. */
export function useDeleteStatusChange(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: statusChangesKey,
    mutationFn: (statusChangeId: string) =>
      sendStatusChange(
        `/api/applications/${applicationId}/status-changes/${statusChangeId}`,
        { method: "DELETE" },
        "The server wouldn't delete this Status Change.",
      ),
    onMutate: async (statusChangeId) => {
      const previous = await holdApplicationQueries(queryClient);
      showHistory(queryClient, applicationId, (statusChanges) =>
        statusChanges.filter((change) => change.id !== statusChangeId),
      );
      return previous;
    },
    onError: (error, _statusChangeId, previous) => {
      if (previous) restoreQueries(queryClient, previous);
      toast.error("That Status Change wasn't deleted.", { description: error.message });
    },
    onSettled: () => refetchWhenSettled(queryClient),
  });
}
