import { Application, ApplicationSummary, type NewApplication } from "@job-tracker/shared";
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
