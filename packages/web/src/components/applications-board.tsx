import { Status } from "@job-tracker/shared";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";
import type { ApplicationRow } from "@/api/applications";
import { useChangeStatus } from "@/api/status-changes";
import { GhostedBadge } from "@/components/ghosted-badge";
import { StatusSelect } from "@/components/status-select";
import { formatAge, sourceLabels, statusLabels } from "@/lib/display";

/**
 * The same Applications as the table, in a column per Status. A card is dragged to another
 * column to move it, which records a Status Change exactly as the table's Status badge does —
 * and the badge is on the card too, so the move is there for anyone not using a pointer.
 */
export function ApplicationsBoard({ applications }: { applications: ApplicationRow[] }) {
  const changeStatus = useChangeStatus();
  // The column the card is over, so it says it will take the drop.
  const [over, setOver] = useState<Status | null>(null);

  function move(applicationId: string, status: Status) {
    const application = applications.find((row) => row.id === applicationId);
    // A row still on its way to the server has no Application to record a change on, and a
    // card dropped back where it came from moved nowhere.
    if (!application || application.pending || application.status === status) return;
    changeStatus.mutate({ applicationId, status });
  }

  return (
    <div className="fade-end flex gap-3 overflow-x-auto p-3 sm:p-4">
      {Status.options.map((status) => {
        const column = applications.filter((application) => application.status === status);
        return (
          <section
            key={status}
            aria-label={statusLabels[status]}
            onDragOver={(event) => {
              // Without this the browser refuses the drop.
              event.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => {
              setOver((current) => (current === status ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(null);
              move(event.dataTransfer.getData("text/plain"), status);
            }}
            className={cn(
              "flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-transparent bg-sidebar-accent/40 p-2 transition-colors",
              over === status && "border-primary bg-sidebar-accent",
            )}
          >
            <header className="flex items-center justify-between gap-2 px-1">
              <span className="label-micro">{statusLabels[status]}</span>
              <span className="text-xs text-muted-foreground">{column.length}</span>
            </header>
            {column.map((application) => (
              <Card key={application.id} application={application} onMove={move} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function Card({
  application,
  onMove,
}: {
  application: ApplicationRow;
  onMove: (applicationId: string, status: Status) => void;
}) {
  return (
    <article
      draggable={!application.pending}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", application.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "panel flex flex-col gap-1.5 p-2.5 text-sm",
        !application.pending && "cursor-grab active:cursor-grabbing",
      )}
    >
      {application.pending ? (
        // There is no Application behind this card's id until the server answers.
        <span className="truncate font-medium">{application.roleTitle}</span>
      ) : (
        <Link
          to="/applications/$applicationId"
          params={{ applicationId: application.id }}
          className="truncate rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {application.roleTitle}
        </Link>
      )}
      <span className="truncate text-xs text-muted-foreground">
        {application.company.name}
        {application.source && ` · ${sourceLabels[application.source]}`}
      </span>
      <div className="flex items-center gap-1.5">
        {!application.pending && (
          <StatusSelect
            status={application.status}
            label={`Status of ${application.roleTitle} at ${application.company.name}`}
            onChange={(status) => {
              onMove(application.id, status);
            }}
          />
        )}
        {application.ghosted && <GhostedBadge since={application.statusChangedAt} />}
        <span className="ml-auto text-xs text-muted-foreground">
          {formatAge(application.statusChangedAt)}
        </span>
      </div>
    </article>
  );
}
