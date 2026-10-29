import { Link } from "@tanstack/react-router";
import type { ApplicationRow } from "@/api/applications";
import { useChangeStatus } from "@/api/status-changes";
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
import { formatDay, sourceLabels } from "@/lib/display";

interface ApplicationsTableProps {
  applications: ApplicationRow[];
  /** Off in a Company view, where every row would repeat the same name. */
  showCompany?: boolean;
}

/** The dense table of Applications, on the home screen and in each Company view. */
export function ApplicationsTable({ applications, showCompany = true }: ApplicationsTableProps) {
  const changeStatus = useChangeStatus();

  return (
    <Table className="border-t">
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4 sm:pl-6">Role</TableHead>
          {showCompany && <TableHead>Company</TableHead>}
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
            {showCompany && (
              <TableCell>
                {application.pending ? (
                  // Nor is there a Company behind it yet, if its name is a new one.
                  application.company.name
                ) : (
                  <Link
                    to="/companies/$companyId"
                    params={{ companyId: application.company.id }}
                    className="hover:underline"
                  >
                    {application.company.name}
                  </Link>
                )}
              </TableCell>
            )}
            <TableCell className="py-0">
              {application.pending ? (
                // Nor can its Status change before there is an Application to record it on.
                <StatusBadge status={application.status} />
              ) : (
                <StatusSelect
                  status={application.status}
                  label={`Status of ${application.roleTitle} at ${application.company.name}`}
                  onChange={(status) => {
                    changeStatus.mutate({ applicationId: application.id, status });
                  }}
                />
              )}
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
