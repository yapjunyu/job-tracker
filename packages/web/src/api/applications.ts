import {
  Application,
  ApplicationSummary,
  type ApplicationDetails,
  type NewApplication,
} from "@job-tracker/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/** What the API said went wrong, or `fallback` when it didn't say. */
async function failureMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // A response that isn't JSON has nothing to tell the job seeker.
  }
  return fallback;
}

/**
 * A row of the table. A row still on its way to the server is marked `pending`: there is no
 * Application behind its id yet, so nothing may follow it to a detail page.
 */
export type ApplicationRow = ApplicationSummary & { pending?: boolean };

/** Every Application in the table, latest Status Change first. */
export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: async (): Promise<ApplicationRow[]> => {
    const response = await fetch("/api/applications");
    if (!response.ok) {
      throw new Error(await failureMessage(response, "Your Applications couldn't be loaded."));
    }
    return ApplicationSummary.array().parse(await response.json());
  },
});

/** One Application with its Status history, or `null` when the job seeker has no such one. */
export function applicationQuery(id: string) {
  return queryOptions({
    queryKey: ["applications", id],
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
      await queryClient.cancelQueries({ queryKey: applicationsQuery.queryKey });
      const previous = queryClient.getQueryData(applicationsQuery.queryKey);
      queryClient.setQueryData(applicationsQuery.queryKey, (rows = []) => [
        asPendingRow(details),
        ...rows,
      ]);
      return { previous };
    },
    onError: (error, _details, context) => {
      // Without a list to go back to, an empty one at least lets the page render again.
      queryClient.setQueryData(applicationsQuery.queryKey, context?.previous ?? []);
      toast.error("That Application wasn't added.", { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationsQuery.queryKey }),
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
      await Promise.all([
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: applicationsQuery.queryKey }),
      ]);
      const previous = {
        application: queryClient.getQueryData(detailKey),
        rows: queryClient.getQueryData(applicationsQuery.queryKey),
      };
      queryClient.setQueryData(detailKey, (application) =>
        application ? withDetails(application, details) : application,
      );
      queryClient.setQueryData(applicationsQuery.queryKey, (rows) =>
        rows?.map((row) => (row.id === id ? withSummaryDetails(row, details) : row)),
      );
      return previous;
    },
    onError: (error, _details, context) => {
      if (context) {
        queryClient.setQueryData(detailKey, context.application);
        queryClient.setQueryData(applicationsQuery.queryKey, context.rows);
      }
      toast.error("That change wasn't saved.", { description: error.message });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: applicationsQuery.queryKey }),
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
      await queryClient.cancelQueries({ queryKey: applicationsQuery.queryKey });
      const previous = queryClient.getQueryData(applicationsQuery.queryKey);
      queryClient.setQueryData(applicationsQuery.queryKey, (rows) =>
        rows?.filter((row) => row.id !== id),
      );
      return { previous };
    },
    onSuccess: () => {
      // Nothing can be loaded for it any more, so asking again would only answer 404.
      queryClient.removeQueries({ queryKey: applicationQuery(id).queryKey });
    },
    onError: (error, _variables, context) => {
      if (context) queryClient.setQueryData(applicationsQuery.queryKey, context.previous);
      toast.error("That Application wasn't deleted.", { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationsQuery.queryKey }),
  });
}
