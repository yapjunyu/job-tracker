import { defaultGhostedThresholdDays, UserSettings } from "@job-tracker/shared";
import { type QueryClient, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateApplicationsAndCompanies } from "@/api/applications";
import { failureMessage } from "@/api/failure-message";

/** The signed-in job seeker's own settings, which is the Ghosted threshold and nothing else yet. */
export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  // The Settings page writes what the server answered straight in, so this is only ever
  // refetched for a change made on another device, which is worth a few minutes' wait.
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<UserSettings> => {
    const response = await fetch("/api/settings");
    if (!response.ok) {
      throw new Error(await failureMessage(response, "Your settings couldn't be loaded."));
    }
    return UserSettings.parse(await response.json());
  },
});

/**
 * The Ghosted threshold as the browser last heard it. The app has the settings in hand before
 * it shows an Application, so this is how a change the server hasn't answered yet can be
 * labelled by the same rule the API labels it with; the default stands in for the moment
 * before the settings have arrived.
 */
export function ghostedThresholdIn(queryClient: QueryClient): number {
  return (
    queryClient.getQueryData(settingsQuery.queryKey)?.ghostedThresholdDays ??
    defaultGhostedThresholdDays
  );
}

/**
 * Saves the settings. The Ghosted threshold is never stored on an Application, so changing it
 * relabels every one of them: each is loaded again rather than relabelled here.
 */
export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error(await failureMessage(response, "The server wouldn't accept this change."));
      }
      return UserSettings.parse(await response.json());
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(settingsQuery.queryKey, saved);
      await invalidateApplicationsAndCompanies(queryClient);
    },
    onError: (error) => {
      toast.error("Those settings weren't saved.", { description: error.message });
    },
  });
}
