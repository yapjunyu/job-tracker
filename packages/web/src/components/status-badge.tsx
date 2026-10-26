import type { Status } from "@job-tracker/shared";
import { cn } from "cn";
import { statusLabels } from "@/lib/display";

// Saved and the final Statuses stay quiet; the Statuses a job seeker is waiting on stand out.
const statusStyles: Record<Status, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-chart-2/15 text-foreground",
  assessment: "bg-chart-2/15 text-foreground",
  interviewing: "bg-chart-2/15 text-foreground",
  offer: "bg-primary text-primary-foreground",
  accepted: "bg-primary text-primary-foreground",
  declined: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
