import {
  closestCenter,
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
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
 * The column the pointer is in takes the drop. By default a card lands wherever most of its
 * own rectangle is, which on a board of narrow columns is often the column beside the one it
 * was dropped on; the nearest column catches the few drops that land in a gap.
 */
const columnUnderPointer: CollisionDetection = (collision) => {
  const under = pointerWithin(collision);
  return under.length > 0 ? under : closestCenter(collision);
};

/**
 * The same Applications as the table, in a column per Status. A card is dragged to another
 * column to move it, which records a Status Change exactly as the table's Status badge does —
 * and the badge is on the card too, so the move is there for anyone not using a pointer.
 */
export function ApplicationsBoard({ applications }: { applications: ApplicationRow[] }) {
  const changeStatus = useChangeStatus();
  const [dragging, setDragging] = useState<string | null>(null);
  // A card is also a link to its Application, so a press only becomes a drag once it has
  // travelled far enough to mean one.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function move(applicationId: string, status: Status) {
    const application = applications.find((row) => row.id === applicationId);
    // A row still on its way to the server has no Application to record a change on, and a
    // card dropped back where it came from moved nowhere.
    if (!application || application.pending || application.status === status) return;
    changeStatus.mutate({ applicationId, status });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    const status = Status.safeParse(over?.id);
    if (status.success) move(String(active.id), status.data);
  }

  const lifted = applications.find((application) => application.id === dragging);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={columnUnderPointer}
      onDragStart={({ active }) => {
        setDragging(String(active.id));
      }}
      onDragCancel={() => {
        setDragging(null);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="fade-end flex h-full gap-3 overflow-x-auto p-3 sm:p-4">
        {Status.options.map((status) => (
          <Column
            key={status}
            status={status}
            applications={applications.filter((application) => application.status === status)}
            onMove={move}
          />
        ))}
      </div>
      {/* The card follows the pointer as one piece, instead of the browser's own washed-out
          snapshot of it, and the card it left behind stays in place as the gap it came from. */}
      <DragOverlay dropAnimation={null}>
        {lifted && <Card application={lifted} onMove={move} lifted />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  applications,
  onMove,
}: {
  status: Status;
  applications: ApplicationRow[];
  onMove: (applicationId: string, status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={statusLabels[status]}
      className={cn(
        "flex max-h-full w-64 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-transparent bg-sidebar-accent/40 p-2 transition-colors",
        isOver && "border-primary bg-sidebar-accent",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-1">
        <span className="label-micro">{statusLabels[status]}</span>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </header>
      {applications.map((application) => (
        <DraggableCard key={application.id} application={application} onMove={onMove} />
      ))}
    </section>
  );
}

function DraggableCard({
  application,
  onMove,
}: {
  application: ApplicationRow;
  onMove: (applicationId: string, status: Status) => void;
}) {
  // Only the drag listeners, not dnd-kit's keyboard attributes: those would make every card
  // a button around its own link, and the Status badge on the card is already the way to
  // move an Application without a pointer.
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: application.id,
    // A row still on its way to the server has no Application to record a change on.
    disabled: application.pending,
  });

  return (
    // While this card is the one in the overlay, its place in the column is left empty.
    <div ref={setNodeRef} {...listeners} className={cn(isDragging && "opacity-0")}>
      <Card application={application} onMove={onMove} />
    </div>
  );
}

function Card({
  application,
  onMove,
  lifted,
}: {
  application: ApplicationRow;
  onMove: (applicationId: string, status: Status) => void;
  /** In the hand: off the board, and saying so. */
  lifted?: boolean;
}) {
  return (
    <article
      className={cn(
        "panel flex flex-col gap-1.5 p-2.5 text-sm",
        !application.pending && (lifted ? "cursor-grabbing shadow-lg" : "cursor-grab"),
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
