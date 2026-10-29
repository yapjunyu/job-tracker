import type { Application } from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { applicationQuery } from "@/api/applications";
import { useDeleteStatusChange, useEditStatusChange } from "@/api/status-changes";
import { DeleteApplicationDialog } from "@/components/delete-application-dialog";
import { EditApplicationDialog } from "@/components/edit-application-dialog";
import { StatusBadge } from "@/components/status-badge";
import { StatusSelect } from "@/components/status-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDayAndTime, sourceLabels, statusLabels } from "@/lib/display";

export const Route = createFileRoute("/_app/applications/$applicationId")({
  loader: async ({ context, params }) => {
    // Another job seeker's Application is answered with a 404, exactly as one that never
    // existed, so nothing here can reveal that it is someone else's.
    const application = await context.queryClient.query(applicationQuery(params.applicationId));
    if (!application) throw notFound();
  },
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { applicationId } = Route.useParams();
  const { data: application } = useQuery(applicationQuery(applicationId));
  if (!application) return null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6">
      <Link
        to="/"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Applications
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {application.roleTitle}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <Link
            to="/companies/$companyId"
            params={{ companyId: application.company.id }}
            className="self-start text-muted-foreground hover:text-foreground hover:underline"
          >
            {application.company.name}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <EditApplicationDialog
            application={application}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon data-icon="inline-start" />
                Edit
              </Button>
            }
          />
          <DeleteApplicationDialog
            application={application}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            }
          />
        </div>
      </header>

      <Separator />

      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Location">{application.location}</Detail>
        <Detail label="Pay">{application.pay}</Detail>
        <Detail label="Source">
          {application.source ? sourceLabels[application.source] : null}
        </Detail>
        <Detail label="Posting">
          {application.postingLink && (
            <a
              href={application.postingLink}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all underline underline-offset-3 hover:text-foreground"
            >
              {application.postingLink}
            </a>
          )}
        </Detail>
      </dl>

      {application.jobDescription && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Job description</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
            {application.jobDescription}
          </p>
        </section>
      )}

      <StatusHistory application={application} />
    </main>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="text-sm text-muted-foreground">{children ?? "Not recorded"}</dd>
    </div>
  );
}

/**
 * Every Status Change, newest first. A mistaken one is corrected by picking the Status it
 * should have recorded, or deleted; the Application's Status follows whichever is latest.
 */
function StatusHistory({ application }: { application: Application }) {
  const editStatusChange = useEditStatusChange(application.id);
  const deleteStatusChange = useDeleteStatusChange(application.id);
  const onlyOne = application.statusChanges.length === 1;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Status history</h2>
      <ol className="flex flex-col gap-1">
        {application.statusChanges.map((statusChange) => {
          const when = formatDayAndTime(statusChange.occurredAt);
          return (
            <li key={statusChange.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusSelect
                status={statusChange.status}
                label={`Status recorded ${when}`}
                onChange={(status) => {
                  editStatusChange.mutate({ statusChangeId: statusChange.id, status });
                }}
              />
              <span className="text-sm text-muted-foreground">{when}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                // An Application always has a Status, so its only Status Change stays.
                disabled={onlyOne}
                title={onlyOne ? "An Application always keeps one Status Change" : undefined}
                aria-label={`Delete the Status Change to ${statusLabels[statusChange.status]} ${when}`}
                onClick={() => {
                  deleteStatusChange.mutate(statusChange.id);
                }}
              >
                <XIcon />
              </Button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
