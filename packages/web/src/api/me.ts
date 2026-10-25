import { User } from "@job-tracker/shared";
import { queryOptions } from "@tanstack/react-query";

/** The signed-in user, or `null` when nobody is signed in. */
export const meQuery = queryOptions({
  queryKey: ["me"],
  // Only signing in or out changes the answer, and both remove every query.
  staleTime: "static",
  queryFn: async (): Promise<User | null> => {
    const response = await fetch("/api/me");
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Checking who is signed in failed with ${response.status}`);
    return User.parse(await response.json());
  },
});
