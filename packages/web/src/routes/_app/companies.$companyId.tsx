import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { companyQuery } from "@/api/companies";
import { ApplicationsTable } from "@/components/applications-table";
import { PageHeader } from "@/components/page-header";
import { RenameCompanyDialog } from "@/components/rename-company-dialog";
import { Button } from "@/components/ui/button";

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

  const count = company.applications.length;

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        back={{ to: "/", label: "Applications" }}
        title={company.name}
        meta={
          <span className="text-muted-foreground">
            {count === 1 ? "1 Application" : `${count.toString()} Applications`}
          </span>
        }
        actions={
          <RenameCompanyDialog
            company={company}
            trigger={
              <Button variant="outline" size="sm">
                <PencilIcon data-icon="inline-start" />
                Rename
              </Button>
            }
          />
        }
      />

      <div className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        <div className="panel overflow-hidden">
          {count === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-muted-foreground">
              No Applications at {company.name} any more.
            </p>
          ) : (
            <ApplicationsTable applications={company.applications} showCompany={false} />
          )}
        </div>
      </div>
    </main>
  );
}
