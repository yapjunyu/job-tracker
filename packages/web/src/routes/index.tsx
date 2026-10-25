import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { healthQuery } from "@/api/health";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

// Placeholder until the Applications table arrives.
function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">job-tracker</h1>
        <p className="text-balance text-muted-foreground">
          Every Application, from Saved to Offer, in one place. Coming soon.
        </p>
        <ApiStatus />
      </div>
    </main>
  );
}

const statusCopy = {
  pending: { label: "Connecting to the API…", dot: "bg-muted-foreground animate-pulse" },
  success: { label: "Connected to the API", dot: "bg-emerald-500" },
  error: { label: "Can't reach the API", dot: "bg-destructive" },
} as const;

function ApiStatus() {
  const { status } = useQuery(healthQuery);
  const { label, dot } = statusCopy[status];

  return (
    <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
      <span aria-hidden className={cn("size-2 rounded-full", dot)} />
      {label}
    </p>
  );
}
