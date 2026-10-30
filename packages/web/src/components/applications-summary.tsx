import { type ApplicationListParams, filteredByStatus, isFinalStatus } from "@job-tracker/shared";
import { cn } from "cn";
import type { ApplicationRow } from "@/api/applications";
import { statusLabels } from "@/lib/display";

/** The cuts of the table worth one click. The rest of the Statuses live in the Status filter. */
const cuts = ["active", "assessment", "interviewing", "offer", "rejected", "all"] as const;
type Cut = (typeof cuts)[number];

const cutLabels: Record<Cut, string> = {
  active: "Active",
  assessment: statusLabels.assessment,
  interviewing: statusLabels.interviewing,
  offer: statusLabels.offer,
  rejected: statusLabels.rejected,
  all: "All",
};

function countOf(cut: Cut, applications: ApplicationRow[]): number {
  if (cut === "all") return applications.length;
  if (cut === "active") return applications.filter((row) => !isFinalStatus(row.status)).length;
  return applications.filter((row) => row.status === cut).length;
}

/** Whether the table as asked for is exactly this cut of it, and nothing narrower. */
function isCurrent(cut: Cut, params: ApplicationListParams): boolean {
  const [only, ...rest] = params.status;
  if (rest.length > 0) return false;
  if (cut === "all") return only === undefined && !params.activeOnly;
  if (cut === "active") return only === undefined && params.activeOnly;
  return only === cut;
}

function asked(cut: Cut, params: ApplicationListParams): ApplicationListParams {
  if (cut === "all") return { ...params, status: [], activeOnly: false };
  if (cut === "active") return { ...params, status: [], activeOnly: true };
  // `filteredByStatus` decides for itself whether a final Status has to show the finished
  // Applications too, so asking for Rejected here can't come back empty.
  return filteredByStatus(params, [cut]);
}

/**
 * How the search stands, as the six cuts of it a job seeker actually asks for. Each one says
 * how many Applications are in it and is also the way to see them, so the row answers "how am
 * I doing" and "show me those" with the same click. Counts come from every Application, not
 * from the rows on screen, so they don't move as the table is narrowed.
 */
export function ApplicationsSummary({
  params,
  onChange,
  all,
}: {
  params: ApplicationListParams;
  onChange: (params: ApplicationListParams) => void;
  /** Every Application the job seeker has, however the table happens to be filtered. */
  all: ApplicationRow[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by how the Application stands"
      className="fade-end -mb-px flex items-stretch gap-4 overflow-x-auto px-4 sm:px-6"
    >
      {cuts.map((cut) => {
        const current = isCurrent(cut, params);
        return (
          <button
            key={cut}
            type="button"
            role="tab"
            aria-selected={current}
            onClick={() => {
              onChange(asked(cut, params));
            }}
            data-current={current ? "" : undefined}
            className={cn(
              "group/cut flex shrink-0 items-center gap-1.5 border-b-2 border-transparent pb-2.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors outline-none",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              "data-current:border-primary data-current:text-foreground",
            )}
          >
            {cutLabels[cut]}
            <span
              data-numeric
              className="rounded-[4px] px-0.5 text-xs font-medium text-muted-foreground transition-colors group-data-current/cut:text-sidebar-accent-foreground sm:bg-muted sm:px-1.5 sm:py-px sm:group-data-current/cut:bg-sidebar-accent"
            >
              {countOf(cut, all)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
