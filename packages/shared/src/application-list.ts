import { z } from "zod";
import { Source } from "./application";
import { isFinalStatus, Status } from "./status";

/** A column of the table the job seeker can sort by. */
export const ApplicationSort = z.enum([
  "roleTitle",
  "company",
  "status",
  "source",
  "statusChangedAt",
]);
export type ApplicationSort = z.infer<typeof ApplicationSort>;

export const SortDirection = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof SortDirection>;

const defaultSort: ApplicationSort = "statusChangedAt";
const defaultDirection: SortDirection = "desc";

/**
 * A filter the job seeker gave several values travels as one comma-separated parameter, so
 * `?status=applied,interviewing`. Left out, it filters on nothing.
 */
function commaSeparated<Value extends z.ZodType<unknown, string>>(value: Value) {
  return z
    .string()
    .optional()
    .transform((values) => (values ? values.split(",") : []))
    .pipe(z.array(value));
}

/**
 * How the table asks for its rows: which Applications it wants and in what order. Sorting,
 * filtering and search all happen in the API, so these are the only things that decide what
 * a job seeker sees. Each is written as the query string carries it, a string, and comes out
 * typed; a value that isn't one of ours is refused rather than quietly dropped.
 */
export const ApplicationListParams = z.object({
  /** Matches a Company's name or a role title, ignoring case. */
  search: z.string().trim().max(200).default(""),
  status: commaSeparated(Status),
  source: commaSeparated(Source),
  /** Company ids, as the Company filter and a Company view name them. */
  company: commaSeparated(z.uuid()),
  /**
   * Narrows the table to the Applications that have gone quiet, or to those that have not.
   * Left out of a request it is `null`, which filters on Ghosted neither way round.
   */
  ghosted: z
    .enum(["true", "false"])
    .optional()
    .transform((asked) => (asked === undefined ? null : asked === "true")),
  /** Hides Applications in a final Status, which is what the table shows until asked not to. */
  activeOnly: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  sort: ApplicationSort.default(defaultSort),
  direction: SortDirection.default(defaultDirection),
});
export type ApplicationListParams = z.infer<typeof ApplicationListParams>;

/** The plain table: every active Application, latest Status Change first. */
export const defaultApplicationListParams: ApplicationListParams = ApplicationListParams.parse({});

/**
 * The table filtered to these Statuses. Asking for a Status an Application has finished in
 * says those Applications are wanted, so the active-only view steps aside instead of leaving
 * the table empty; every filter, this one included, otherwise narrows what the others leave.
 */
export function filteredByStatus(
  params: ApplicationListParams,
  status: Status[],
): ApplicationListParams {
  return { ...params, status, activeOnly: params.activeOnly && !status.some(isFinalStatus) };
}

/**
 * The same table sorted by a column. Sorting by the column it is already sorted by turns it
 * around; a new column starts whichever way round shows the most interesting Applications
 * first — a time at its newest, everything else at the start of the alphabet or of the
 * hiring process. The table's headers and the phone-sized sort both go through here, so they
 * can't come to different answers.
 */
export function sortedBy(
  params: ApplicationListParams,
  column: ApplicationSort,
): ApplicationListParams {
  const direction: SortDirection =
    params.sort === column
      ? params.direction === "asc"
        ? "desc"
        : "asc"
      : column === "statusChangedAt"
        ? "desc"
        : "asc";
  return { ...params, sort: column, direction };
}

/**
 * Whether the parameters narrow the table at all, search included. Sorting is not narrowing:
 * it changes the order of the same Applications.
 */
export function isFiltered(params: ApplicationListParams): boolean {
  return (
    params.search !== "" ||
    params.status.length > 0 ||
    params.source.length > 0 ||
    params.company.length > 0 ||
    params.ghosted !== null ||
    !params.activeOnly
  );
}

/**
 * The list parameters as a query string, without the leading `?`. Everything the API already
 * defaults to is left out, so the plain table asks for nothing and the string stays short
 * enough to read. Written out by hand rather than with `URLSearchParams`, which this package
 * can't reach for: the same code runs in the browser and on the server.
 */
export function applicationListQuery(params: ApplicationListParams): string {
  const asked: string[] = [];
  const ask = (name: string, value: string) => asked.push(`${name}=${encodeURIComponent(value)}`);
  if (params.search) ask("search", params.search);
  if (params.status.length > 0) ask("status", params.status.join(","));
  if (params.source.length > 0) ask("source", params.source.join(","));
  if (params.company.length > 0) ask("company", params.company.join(","));
  if (params.ghosted !== null) ask("ghosted", params.ghosted ? "true" : "false");
  if (!params.activeOnly) ask("activeOnly", "false");
  if (params.sort !== defaultSort) ask("sort", params.sort);
  if (params.direction !== defaultDirection) ask("direction", params.direction);
  return asked.join("&");
}
