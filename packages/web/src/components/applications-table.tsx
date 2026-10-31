import type { ApplicationSort, SortDirection } from "@job-tracker/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { ApplicationRow } from "@/api/applications";
import { useChangeStatus } from "@/api/status-changes";
import { GhostedBadge } from "@/components/ghosted-badge";
import { StatusBadge } from "@/components/status-badge";
import { StatusSelect } from "@/components/status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAge, formatDayAndTime, sortLabels, sourceLabels } from "@/lib/display";
import { useShortcuts } from "@/lib/shortcuts";

/** How the table is sorted, and what a click on a column header asks for. */
export interface TableSorting {
  sort: ApplicationSort;
  direction: SortDirection;
  /** Sorts by this column, which the table leaves to the page: it decides which way round. */
  onSort: (column: ApplicationSort) => void;
}

interface ApplicationsTableProps {
  applications: ApplicationRow[];
  /** Off in a Company view, where every row would repeat the same name. */
  showCompany?: boolean;
  /** Left out in a Company view, which shows one Company's history in its own order. */
  sorting?: TableSorting;
}

/**
 * The dense table of Applications, on the home screen and in each Company view. It can be
 * worked from the keyboard alone: the arrow keys, or `j` and `k`, move between rows, `Enter`
 * opens the row the keyboard is on and `s` changes its Status. `ShortcutsHelp` lists them all.
 */
export function ApplicationsTable({
  applications,
  showCompany = true,
  sorting,
}: ApplicationsTableProps) {
  const changeStatus = useChangeStatus();
  const navigate = useNavigate();
  const table = useRef<HTMLTableElement>(null);
  const rows = useRef(new Map<string, HTMLTableRowElement>());
  const statuses = useRef(new Map<string, HTMLButtonElement>());
  const [keyboardOn, setKeyboardOn] = useState<string | null>(null);
  // The keyboard starts at the first row, and goes back to it if the row it was on has gone.
  const onRow =
    keyboardOn !== null && applications.some((application) => application.id === keyboardOn)
      ? keyboardOn
      : applications[0]?.id;

  /** The row the keyboard is on, when it is on the row itself and not on something in it. */
  function rowWithKeyboard(): ApplicationRow | undefined {
    const focused = document.activeElement;
    const [id] = [...rows.current].find(([, element]) => element === focused) ?? [];
    return applications.find((application) => application.id === id);
  }

  /** Moves the keyboard `step` rows along, or onto the row it was last on when it is away. */
  function moveKeyboard(step: number) {
    const ids = applications.map((application) => application.id);
    const from = ids.indexOf(onRow ?? "");
    const to = Math.min(Math.max(from + step, 0), ids.length - 1);
    const id = ids[to];
    if (!id) return;
    setKeyboardOn(id);
    rows.current.get(id)?.focus();
  }

  useShortcuts((event) => {
    const focused = document.activeElement;
    // A list or a dialog that is open answers its own keys; anywhere else on the page they
    // are the table's, so the job seeker never has to click back into it first.
    if (focused?.closest('[role="listbox"], [role="dialog"]')) return;
    const inTable = focused !== null && table.current?.contains(focused) === true;
    const row = rowWithKeyboard();

    switch (event.key) {
      case "ArrowDown":
      case "j":
        event.preventDefault();
        // From anywhere but a row — a column header, the filters, the page itself — this
        // first brings the keyboard back to the row it was on.
        moveKeyboard(row ? 1 : 0);
        break;
      case "ArrowUp":
      case "k":
        event.preventDefault();
        moveKeyboard(row ? -1 : 0);
        break;
      case "Home":
        if (!inTable) return;
        event.preventDefault();
        moveKeyboard(-applications.length);
        break;
      case "End":
        if (!inTable) return;
        event.preventDefault();
        moveKeyboard(applications.length);
        break;
      case "Enter":
        // There is no Application behind a pending row's id yet, so it has nowhere to lead.
        if (!row || row.pending) return;
        event.preventDefault();
        void navigate({
          to: "/applications/$applicationId",
          params: { applicationId: row.id },
        });
        break;
      case "s":
        if (!row || row.pending) return;
        event.preventDefault();
        // Opening the row's own Status badge is exactly what clicking it does.
        statuses.current.get(row.id)?.click();
        break;
    }
  });

  return (
    <Table ref={table}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <ColumnHead
            column="roleTitle"
            sorting={sorting}
            className="w-full pl-3 sm:w-[30%] sm:pl-4"
          >
            {sortLabels.roleTitle}
          </ColumnHead>
          {showCompany && (
            <ColumnHead column="company" sorting={sorting} className="hidden w-[22%] sm:table-cell">
              {sortLabels.company}
            </ColumnHead>
          )}
          <ColumnHead column="status" sorting={sorting}>
            {sortLabels.status}
          </ColumnHead>
          <ColumnHead column="source" sorting={sorting} className="hidden md:table-cell">
            {sortLabels.source}
          </ColumnHead>
          <ColumnHead
            column="statusChangedAt"
            sorting={sorting}
            className="hidden pr-3 sm:pr-4 md:table-cell"
          >
            {sortLabels.statusChangedAt}
          </ColumnHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow
            key={application.id}
            ref={(element) => {
              if (element) rows.current.set(application.id, element);
              else rows.current.delete(application.id);
            }}
            // One row at a time is in the tab order, so Tab passes the table by and the
            // arrow keys move within it.
            tabIndex={application.id === onRow ? 0 : -1}
            onFocus={() => {
              setKeyboardOn(application.id);
            }}
            className="outline-none focus-visible:bg-sidebar-accent focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-inset"
          >
            <TableCell className="w-full max-w-0 py-0 pl-3 font-medium sm:w-[30%] sm:pl-4">
              {application.pending ? (
                // There is no Application behind this row's id until the server answers,
                // so it has nowhere to lead yet.
                <span className="-mx-1.5 block px-1.5 py-2">
                  <RoleTitle application={application} showCompany={showCompany} />
                </span>
              ) : (
                <Link
                  to="/applications/$applicationId"
                  params={{ applicationId: application.id }}
                  // The whole cell is the target, so the row is easy to hit on a phone.
                  className="-mx-1.5 block rounded-sm px-1.5 py-2 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RoleTitle application={application} showCompany={showCompany} />
                </Link>
              )}
            </TableCell>
            {showCompany && (
              <TableCell className="hidden w-[22%] max-w-0 text-muted-foreground sm:table-cell">
                {application.pending ? (
                  // Nor is there a Company behind it yet, if its name is a new one.
                  <span className="block truncate">{application.company.name}</span>
                ) : (
                  <Link
                    to="/companies/$companyId"
                    params={{ companyId: application.company.id }}
                    className="block truncate rounded-sm outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {application.company.name}
                  </Link>
                )}
              </TableCell>
            )}
            <TableCell className="py-0">
              <div className="flex items-center gap-1.5">
                {application.pending ? (
                  // Nor can its Status change before there is an Application to record it on.
                  <StatusBadge status={application.status} />
                ) : (
                  <StatusSelect
                    triggerRef={(element) => {
                      if (element) statuses.current.set(application.id, element);
                      else statuses.current.delete(application.id);
                    }}
                    status={application.status}
                    inTable
                    label={`Status of ${application.roleTitle} at ${application.company.name}`}
                    onChange={(status) => {
                      changeStatus.mutate({ applicationId: application.id, status });
                    }}
                  />
                )}
                {application.ghosted && <GhostedBadge since={application.statusChangedAt} />}
              </div>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {application.source ? sourceLabels[application.source] : "—"}
            </TableCell>
            <TableCell
              className="hidden pr-3 text-muted-foreground sm:pr-4 md:table-cell"
              title={formatDayAndTime(application.statusChangedAt)}
            >
              {formatAge(application.statusChangedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A column heading. Where the table sorts, it is a button that sorts by its column and says
 * which way the table stands, so a screen reader reads the order out as well as the name.
 */
function ColumnHead({
  column,
  sorting,
  className,
  children,
}: {
  column: ApplicationSort;
  sorting: TableSorting | undefined;
  className?: string;
  children: string;
}) {
  if (!sorting) {
    return <TableHead className={cn("label-micro", className)}>{children}</TableHead>;
  }

  const sortedByThis = sorting.sort === column;
  const Arrow = sorting.direction === "asc" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <TableHead
      aria-sort={sortedByThis ? (sorting.direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("p-0", className)}
    >
      <button
        type="button"
        onClick={() => {
          sorting.onSort(column);
        }}
        className="label-micro flex h-9 w-full items-center gap-1 rounded-sm px-1.5 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-sorted:text-foreground"
        data-sorted={sortedByThis ? "" : undefined}
      >
        {children}
        {sortedByThis && <Arrow className="size-3 shrink-0" aria-hidden />}
      </button>
    </TableHead>
  );
}

/**
 * The role title, and under it whatever this width has no column for, so every Application
 * still shows its Company, its Source and the age of its latest Status Change at any width.
 */
function RoleTitle({
  application,
  showCompany,
}: {
  application: ApplicationRow;
  showCompany: boolean;
}) {
  const source = application.source ? sourceLabels[application.source] : "No Source";
  return (
    <>
      <span className="block truncate">{application.roleTitle}</span>
      <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground md:hidden">
        {showCompany && <span className="sm:hidden">{application.company.name} · </span>}
        {source} · {formatAge(application.statusChangedAt)}
      </span>
    </>
  );
}
