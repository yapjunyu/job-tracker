import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
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
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <BrandMark className="size-7" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-[-0.01em]">This page doesn't exist</h1>
          <p className="text-sm text-balance text-muted-foreground">
            The link may be out of date, or the Application it pointed at has been deleted.
          </p>
        </div>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Back to job-tracker
        </Link>
      </div>
    </main>
  );
}
