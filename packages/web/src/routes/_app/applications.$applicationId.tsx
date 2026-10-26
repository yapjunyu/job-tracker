import type { Application } from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { applicationQuery } from "@/api/applications";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDayAndTime, sourceLabels } from "@/lib/display";

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

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {application.roleTitle}
          </h1>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-muted-foreground">{application.company.name}</p>
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

      <StatusHistory statusChanges={application.statusChanges} />
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

function StatusHistory({ statusChanges }: { statusChanges: Application["statusChanges"] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Status history</h2>
      <ol className="flex flex-col gap-2">
        {statusChanges.map((statusChange) => (
          <li key={statusChange.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={statusChange.status} />
            <span className="text-sm text-muted-foreground">
              {formatDayAndTime(statusChange.occurredAt)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
