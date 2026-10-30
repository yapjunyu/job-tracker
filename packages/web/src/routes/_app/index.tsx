import {
  type ApplicationListParams,
  defaultApplicationListParams,
  isFiltered,
  sortedBy,
} from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon, SearchXIcon } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { applicationsQuery } from "@/api/applications";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { ApplicationsFilters } from "@/components/applications-filters";
import { ApplicationsSummary } from "@/components/applications-summary";
import { ApplicationsTable, type TableSorting } from "@/components/applications-table";
import { PageHeader } from "@/components/page-header";
import { BlurText } from "@/components/react-bits/blur-text";
import { TableSkeleton } from "@/components/table-skeleton";
import { Button } from "@/components/ui/button";
import { useShortcuts } from "@/lib/shortcuts";

export const Route = createFileRoute("/_app/")({ component: Home });

/** Every Application there is, which is what the counts row counts and the empty state asks. */
const everyApplication = { ...defaultApplicationListParams, activeOnly: false };

function Home() {
  const [params, setParams] = useState<ApplicationListParams>(defaultApplicationListParams);
  // One dialog for both ways into it: the button in the band, and the empty state's own.
  const [addOpen, setAddOpen] = useState(false);
  // Typing stays instant; the list catches up with it.
  const search = useDeferredValue(params.search);
  const asked = useMemo(() => ({ ...params, search }), [params, search]);
  const applications = useQuery(applicationsQuery(asked));
  const all = useQuery(applicationsQuery(everyApplication));
  const searchField = useRef<HTMLInputElement>(null);

  useShortcuts((event) => {
    if (event.key !== "/") return;
    event.preventDefault();
    searchField.current?.focus();
  });

  const sorting: TableSorting = {
    sort: params.sort,
    direction: params.direction,
    onSort: (column) => {
      setParams((current) => sortedBy(current, column));
    },
  };

  const rows = applications.data;
  const filtered = isFiltered(asked);
  // Until there is an Application to look for, the counts and the filter bar have nothing to
  // narrow down, and the page is an invitation instead of a table.
  const nothingTracked = all.data?.length === 0;

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Applications"
        actions={
          <AddApplicationDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            trigger={
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                Add Application
              </Button>
            }
          />
        }
      >
        {all.data && all.data.length > 0 && (
          <ApplicationsSummary params={params} onChange={setParams} all={all.data} />
        )}
      </PageHeader>

      {nothingTracked ? (
        <EmptyState
          onAdd={() => {
            setAddOpen(true);
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <ApplicationsFilters params={params} onChange={setParams} searchRef={searchField} />

          <div className="panel overflow-hidden">
            {applications.isPending && <TableSkeleton />}
            {applications.isError && (
              <Note
                title="Your Applications couldn't be loaded."
                detail={applications.error.message}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void applications.refetch();
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            )}
            {rows?.length === 0 && filtered && (
              <Note
                icon={<SearchXIcon className="size-5" aria-hidden />}
                title="No Applications match what you're looking for."
                detail="Try a different search, or clear the filters above to see everything again."
              />
            )}
            {rows && rows.length > 0 && <ApplicationsTable applications={rows} sorting={sorting} />}
          </div>
        </div>
      )}
    </main>
  );
}

/** Something the table has to say instead of rows: nothing found, or nothing loaded. */
function Note({
  icon,
  title,
  detail,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <p className="text-sm font-medium">{title}</p>
      {detail && <p className="max-w-xs text-sm text-balance text-muted-foreground">{detail}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid flex-1 place-items-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h2 className="text-xl font-semibold tracking-[-0.01em]">
          <BlurText text="Nothing tracked yet." />
        </h2>
        <p className="text-sm text-balance text-muted-foreground">
          Add the first role you're after. Every Application you add, from Saved to Offer, shows up
          here.
        </p>
        <Button className="mt-1" onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          Add your first Application
        </Button>
      </div>
    </div>
  );
}
