import { type Application, Company, CompanyWithApplications } from "@job-tracker/shared";
import {
  keepPreviousData,
  type Query,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateApplicationsAndCompanies, updateTableRows } from "@/api/applications";
import { failureMessage } from "@/api/failure-message";
import { applicationsKey, companiesKey } from "@/api/query-keys";

/** The job seeker's Companies whose names contain `search`, ignoring case, in name order. */
export function companySuggestionsQuery(search: string) {
  return queryOptions({
    queryKey: [...companiesKey, { search }],
    queryFn: async () => {
      const response = await fetch(`/api/companies?${new URLSearchParams({ search }).toString()}`);
      if (!response.ok) {
        throw new Error(await failureMessage(response, "Your Companies couldn't be loaded."));
      }
      return Company.array().parse(await response.json());
    },
    // The last suggestions stay up while the next ones load, so the list doesn't flicker.
    placeholderData: keepPreviousData,
  });
}

/** One Company with its Applications, or `null` when the job seeker has no such Company. */
export function companyQuery(id: string) {
  return queryOptions({
    queryKey: [...companiesKey, id],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(await failureMessage(response, "This Company couldn't be loaded."));
      }
      return CompanyWithApplications.parse(await response.json());
    },
  });
}

/** One Application's query, as opposed to the table's, which shares the start of its key. */
function isOneApplication(query: Query) {
  return query.queryKey.length === applicationsKey.length + 1;
}

/**
 * Renames a Company. The new name shows at once in the Company view, in the table and on
 * each of its Applications, and every one of them goes back, with a message saying why, if
 * the server rejects it, as it does a name another of the job seeker's Companies has.
 */
export function useRenameCompany(id: string) {
  const queryClient = useQueryClient();
  const companyKey = companyQuery(id).queryKey;

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(await failureMessage(response, "The server wouldn't accept this name."));
      }
      return Company.parse(await response.json());
    },
    onMutate: async (name) => {
      // Stops answers already on their way back from overwriting the name just given.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: companyKey }),
        queryClient.cancelQueries({ queryKey: applicationsKey }),
      ]);
      const previous = {
        company: queryClient.getQueryData(companyKey),
        applications: queryClient.getQueriesData({ queryKey: applicationsKey }),
      };
      const renamed = <Row extends { company: Company }>(row: Row): Row =>
        row.company.id === id ? { ...row, company: { ...row.company, name } } : row;
      queryClient.setQueryData(companyKey, (company) => company && { ...company, name });
      updateTableRows(queryClient, (rows) => rows.map(renamed));
      queryClient.setQueriesData<Application | null>(
        { queryKey: applicationsKey, predicate: isOneApplication },
        (application) => application && renamed(application),
      );
      return previous;
    },
    onError: (error, _name, context) => {
      if (context) {
        queryClient.setQueryData(companyKey, context.company);
        for (const [key, data] of context.applications) queryClient.setQueryData(key, data);
      }
      toast.error("That Company wasn't renamed.", { description: error.message });
    },
    onSettled: () => invalidateApplicationsAndCompanies(queryClient),
  });
}
