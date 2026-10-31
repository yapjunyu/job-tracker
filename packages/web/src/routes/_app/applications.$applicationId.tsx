import type { Application } from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { cn } from "cn";
import { ExternalLinkIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { applicationQuery } from "@/api/applications";
import { useDeleteStatusChange, useEditStatusChange } from "@/api/status-changes";
import { DeleteApplicationDialog } from "@/components/delete-application-dialog";
import { EditApplicationDialog } from "@/components/edit-application-dialog";
import { GhostedBadge } from "@/components/ghosted-badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatusSelect } from "@/components/status-select";
import { Button } from "@/components/ui/button";
import { formatAgePhrase, formatDayAndTime, sourceLabels, statusLabels } from "@/lib/display";

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
    <main className="flex flex-1 flex-col">
      <PageHeader
        back={{ to: "/", label: "Applications" }}
        title={application.roleTitle}
        meta={
          <>
            <StatusBadge status={application.status} />
            {application.ghosted && <GhostedBadge since={application.statusChangedAt} />}
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <Link
              to="/companies/$companyId"
              params={{ companyId: application.company.id }}
              className="rounded-sm font-medium outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {application.company.name}
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span
              className="text-muted-foreground"
              title={formatDayAndTime(application.statusChangedAt)}
            >
              Last change {formatAgePhrase(application.statusChangedAt)}
            </span>
          </>
        }
        actions={
          <>
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
          </>
        }
      />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex flex-col gap-4">
            <Panel title="Details">
              {/* Four short values, so they read as one band rather than a sparse grid
                  with a column of air beside it. */}
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      title={application.postingLink}
                      className="inline-flex max-w-full items-center gap-1 rounded-sm text-primary underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* The host is the part worth reading in a narrow column; the whole
                          link is a hover and a click away. */}
                      <span className="truncate">{hostOf(application.postingLink)}</span>
                      <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
                    </a>
                  )}
                </Detail>
              </dl>
            </Panel>

            {application.jobDescription && (
              <Panel title="Job description">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {application.jobDescription}
                </p>
              </Panel>
            )}
          </div>

          <StatusHistory application={application} />
        </div>
      </div>
    </main>
  );
}

/** A posting link's host, or the whole link when it isn't one the browser can parse. */
function hostOf(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2 className="label-micro border-b border-border px-4 py-2.5">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm", children ? "text-foreground" : "text-muted-foreground")}>
        {children ?? "Not recorded"}
      </dd>
    </div>
  );
}

/**
 * Every Status Change, newest first, on the line that joins them: this is the Application's
 * history, and the top of it is where its current Status comes from. A mistaken one is
 * corrected by picking the Status it should have recorded, or deleted.
 */
function StatusHistory({ application }: { application: Application }) {
  const editStatusChange = useEditStatusChange(application.id);
  const deleteStatusChange = useDeleteStatusChange(application.id);
  const onlyOne = application.statusChanges.length === 1;

  return (
    <section className="panel lg:sticky lg:top-4">
      <h2 className="label-micro border-b border-border px-4 py-2.5">Status history</h2>
      <ol className="flex flex-col gap-3 p-4">
        {application.statusChanges.map((statusChange, index) => {
          const when = formatDayAndTime(statusChange.occurredAt);
          const latest = index === 0;
          return (
            <li key={statusChange.id} className="relative flex gap-3">
              <span className="relative flex w-2.5 shrink-0 justify-center" aria-hidden>
                <span
                  className={cn(
                    "z-10 mt-2 size-2.5 shrink-0 rounded-full",
                    latest ? "bg-primary" : "bg-border-strong",
                  )}
                />
                {index < application.statusChanges.length - 1 && (
                  <span className="absolute top-4 -bottom-3 w-px bg-border" />
                )}
              </span>
              {/* The Status and the day it was recorded sit on their own lines, so a long
                  date can never push the delete button onto a line of its own. */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
                <div className="flex min-w-0 items-center gap-2">
                  <StatusSelect
                    status={statusChange.status}
                    label={`Status recorded ${when}`}
                    onChange={(status) => {
                      editStatusChange.mutate({ statusChangeId: statusChange.id, status });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto shrink-0 text-muted-foreground"
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
                </div>
                <time className="text-xs text-muted-foreground" dateTime={statusChange.occurredAt}>
                  {when}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
