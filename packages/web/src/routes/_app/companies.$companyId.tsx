import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { companyQuery } from "@/api/companies";
import { ApplicationsTable } from "@/components/applications-table";
import { RenameCompanyDialog } from "@/components/rename-company-dialog";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_app/companies/$companyId")({
  loader: async ({ context, params }) => {
    // Another job seeker's Company is answered with a 404, exactly as one that never existed.
    const company = await context.queryClient.query(companyQuery(params.companyId));
    if (!company) throw notFound();
  },
  component: CompanyView,
});

/** A Company and every Application the job seeker has made there. */
function CompanyView() {
  const { companyId } = Route.useParams();
  const { data: company } = useQuery(companyQuery(companyId));
  if (!company) return null;

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 self-start",
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Applications
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-lg font-semibold tracking-tight">{company.name}</h1>
            <p className="text-sm text-muted-foreground">
              {company.applications.length === 1
                ? "1 Application"
                : `${company.applications.length} Applications`}
            </p>
          </div>
          <RenameCompanyDialog
            company={company}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon data-icon="inline-start" />
                Rename
              </Button>
            }
          />
        </div>
      </div>

      {company.applications.length === 0 ? (
        <p className="px-4 text-sm text-muted-foreground sm:px-6">
          No Applications at {company.name} any more.
        </p>
      ) : (
        <ApplicationsTable applications={company.applications} showCompany={false} />
      )}
    </main>
  );
}
