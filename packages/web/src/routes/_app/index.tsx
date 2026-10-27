import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { applicationsQuery } from "@/api/applications";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { ApplicationsTable } from "@/components/applications-table";
import { BlurText } from "@/components/react-bits/blur-text";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/")({ component: Home });

function Home() {
  const applications = useQuery(applicationsQuery);

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h1 className="font-heading text-lg font-semibold tracking-tight">Applications</h1>
        <AddApplicationDialog
          trigger={
            <Button size="sm">
              <PlusIcon data-icon="inline-start" />
              Add Application
            </Button>
          }
        />
      </div>

      {applications.isPending && <Message>Loading your Applications…</Message>}
      {applications.isError && <Message>{applications.error.message}</Message>}
      {applications.data?.length === 0 && <EmptyState />}
      {applications.data && applications.data.length > 0 && (
        <ApplicationsTable applications={applications.data} />
      )}
    </main>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="px-4 text-sm text-muted-foreground sm:px-6">{children}</p>;
}

function EmptyState() {
  return (
    <div className="grid flex-1 place-items-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          <BlurText text="Nothing tracked yet." />
        </h2>
        <p className="text-balance text-muted-foreground">
          Add the first role you're after. Every Application you add, from Saved to Offer, shows up
          here.
        </p>
        <AddApplicationDialog
          trigger={
            <Button className="mt-1">
              <PlusIcon data-icon="inline-start" />
              Add your first Application
            </Button>
          }
        />
      </div>
    </div>
  );
}
