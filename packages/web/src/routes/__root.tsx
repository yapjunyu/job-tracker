import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page doesn't exist</h1>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Back to job-tracker
        </Link>
      </div>
    </main>
  );
}
