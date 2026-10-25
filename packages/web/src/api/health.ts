import { Health } from "@job-tracker/shared";
import { queryOptions } from "@tanstack/react-query";

export const healthQuery = queryOptions({
  queryKey: ["health"],
  queryFn: async () => {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`Health check failed with ${response.status}`);
    return Health.parse(await response.json());
  },
});
