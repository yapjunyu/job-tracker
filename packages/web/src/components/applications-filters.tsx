import {
  type ApplicationListParams,
  ApplicationSort,
  defaultApplicationListParams,
  isFiltered,
  sortedBy,
  Source,
  Status,
} from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, XIcon } from "lucide-react";
import type { RefObject } from "react";
import { companySuggestionsQuery } from "@/api/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { sortLabels, sourceLabels, statusLabels } from "@/lib/display";

interface FilterSelectProps<Value extends string> {
  /** What the filter is called, shown while nothing is picked. */
  label: string;
  options: readonly Value[];
  labels: Record<string, string | undefined>;
  value: Value[];
  onChange: (value: Value[]) => void;
}

/**
 * One filter, holding as many values as the job seeker picks. Its trigger says what is
 * filtered for, so the bar reads as a sentence about what the table is showing.
 */
function FilterSelect<Value extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: FilterSelectProps<Value>) {
  const [only] = value;
  const summary =
    value.length === 0
      ? label
      : value.length === 1
        ? (labels[only ?? ""] ?? label)
        : `${label}: ${value.length}`;

  return (
    <Select
      multiple
      value={value}
      onValueChange={(picked: Value[]) => {
        onChange(picked);
      }}
    >
      <SelectTrigger
        size="sm"
        // Named as a filter, so it isn't taken for the Status of a row or a field of a form.
        aria-label={`Filter by ${label}`}
        className={value.length > 0 ? "border-ring bg-accent/50" : undefined}
      >
        <span className="truncate">{summary}</span>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ApplicationsFiltersProps {
  params: ApplicationListParams;
  onChange: (params: ApplicationListParams) => void;
  /** So `/` can put the job seeker in the search field from anywhere on the page. */
  searchRef: RefObject<HTMLInputElement | null>;
}

/**
 * The bar above the table: a search, a filter per column that has one, and the switch between
 * the active Applications and all of them. Each of them only says what to ask the API for;
 * the API decides which Applications come back.
 */
export function ApplicationsFilters({ params, onChange, searchRef }: ApplicationsFiltersProps) {
  // Every Company the job seeker has, in name order, for the Company filter's options.
  const companies = useQuery(companySuggestionsQuery(""));
  const companyOptions = (companies.data ?? []).map((company) => company.id);
  const companyLabels = Object.fromEntries(
    (companies.data ?? []).map((company) => [company.id, company.name]),
  );

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-6">
      <div className="relative order-first w-full min-w-0 sm:w-56">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          type="search"
          value={params.search}
          aria-label="Search Applications"
          placeholder="Search role or Company"
          className="pl-8"
          onChange={(event) => {
            onChange({ ...params, search: event.target.value });
          }}
          onKeyDown={(event) => {
            // Escape gives the keyboard back to the table, keeping what was typed. Chrome
            // would otherwise empty a search field, which is what Clear filters is for.
            if (event.key === "Escape") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </div>

      <FilterSelect
        label="Status"
        options={Status.options}
        labels={statusLabels}
        value={params.status}
        onChange={(status) => {
          onChange({ ...params, status });
        }}
      />
      <FilterSelect
        label="Source"
        options={Source.options}
        labels={sourceLabels}
        value={params.source}
        onChange={(source) => {
          onChange({ ...params, source });
        }}
      />
      {companyOptions.length > 0 && (
        <FilterSelect
          label="Company"
          options={companyOptions}
          labels={companyLabels}
          value={params.company}
          onChange={(company) => {
            onChange({ ...params, company });
          }}
        />
      )}

      {/* Below `sm` the table has no room for the Source and Last change columns, so their
          headers aren't there to sort by: this is how every column stays reachable there. */}
      <div className="flex items-center gap-1 sm:hidden">
        <Select
          value={params.sort}
          onValueChange={(sort) => {
            // The list is never emptied, so there is always a column to sort by. Picking
            // the one it is already sorted by changes nothing, so it never turns around here.
            if (sort && sort !== params.sort) onChange(sortedBy(params, sort));
          }}
        >
          <SelectTrigger size="sm" aria-label="Sort by">
            <span className="truncate">{sortLabels[params.sort]}</span>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {ApplicationSort.options.map((option) => (
              <SelectItem key={option} value={option}>
                {sortLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Reverse the order"
          onClick={() => {
            onChange({ ...params, direction: params.direction === "asc" ? "desc" : "asc" });
          }}
        >
          {params.direction === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </Button>
      </div>

      <Button
        variant={params.activeOnly ? "outline" : "secondary"}
        size="sm"
        aria-pressed={!params.activeOnly}
        onClick={() => {
          onChange({ ...params, activeOnly: !params.activeOnly });
        }}
      >
        Show all
      </Button>

      {isFiltered(params) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({
              ...defaultApplicationListParams,
              sort: params.sort,
              direction: params.direction,
            });
          }}
        >
          <XIcon data-icon="inline-start" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
