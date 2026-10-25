import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({ component: Home });

// Placeholder until the Applications table arrives.
function Home() {
  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">No Applications yet</h1>
        <p className="text-balance text-muted-foreground">
          Every Application you add, from Saved to Offer, will show up here.
        </p>
      </div>
    </main>
  );
}
