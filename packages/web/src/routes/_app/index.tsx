import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { applicationsQuery, type ApplicationRow } from "@/api/applications";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { BlurText } from "@/components/react-bits/blur-text";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay, sourceLabels } from "@/lib/display";

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

function ApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  return (
    <Table className="border-t">
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4 sm:pl-6">Role</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Source</TableHead>
          <TableHead className="hidden pr-4 sm:pr-6 md:table-cell">Last change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id}>
            <TableCell className="py-0 pl-4 font-medium sm:pl-6">
              {application.pending ? (
                // There is no Application behind this row's id until the server answers,
                // so it has nowhere to lead yet.
                <span className="-mx-2 block px-2 py-2.5">
                  <RoleTitle application={application} />
                </span>
              ) : (
                <Link
                  to="/applications/$applicationId"
                  params={{ applicationId: application.id }}
                  // The whole cell is the target, so the row is easy to hit on a phone.
                  className="-mx-2 block px-2 py-2.5 hover:underline"
                >
                  <RoleTitle application={application} />
                </Link>
              )}
            </TableCell>
            <TableCell>{application.company.name}</TableCell>
            <TableCell>
              <StatusBadge status={application.status} />
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {application.source ? sourceLabels[application.source] : "—"}
            </TableCell>
            <TableCell className="hidden pr-4 text-muted-foreground sm:pr-6 md:table-cell">
              {formatDay(application.statusChangedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * The role title, and under it the two columns a phone has no room for, so every Application
 * still shows its Source and the time of its latest Status Change at any width.
 */
function RoleTitle({ application }: { application: ApplicationRow }) {
  return (
    <>
      {application.roleTitle}
      <span className="mt-0.5 block text-xs font-normal text-muted-foreground sm:hidden">
        {application.source ? sourceLabels[application.source] : "No Source"} ·{" "}
        {formatDay(application.statusChangedAt)}
      </span>
    </>
  );
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
