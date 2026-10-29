import { describe, expect, it } from "vitest";
import {
  ApplicationListParams,
  applicationListQuery,
  defaultApplicationListParams,
  isFiltered,
  sortedBy,
} from "./application-list";

describe("the table's list parameters", () => {
  it("shows only active Applications, latest Status Change first, when nothing is asked for", () => {
    expect(ApplicationListParams.parse({})).toEqual({
      search: "",
      status: [],
      source: [],
      company: [],
      activeOnly: true,
      sort: "statusChangedAt",
      direction: "desc",
    });
  });

  it("reads a filter the job seeker gave several values as one comma-separated parameter", () => {
    const params = ApplicationListParams.parse({ status: "applied,interviewing" });

    expect(params.status).toEqual(["applied", "interviewing"]);
  });

  it("reads filters that are combined, each on its own parameter", () => {
    const params = ApplicationListParams.parse({
      status: "applied",
      source: "linkedin,referral",
      search: "intern",
    });

    expect(params).toMatchObject({
      status: ["applied"],
      source: ["linkedin", "referral"],
      search: "intern",
    });
  });

  it("refuses a Status that isn't one, rather than quietly ignoring it", () => {
    expect(() => ApplicationListParams.parse({ status: "applied,nonsense" })).toThrow();
  });

  it("refuses a column the table can't be sorted by", () => {
    expect(() => ApplicationListParams.parse({ sort: "pay" })).toThrow();
  });

  it("shows finished Applications too once active-only is turned off", () => {
    expect(ApplicationListParams.parse({ activeOnly: "false" }).activeOnly).toBe(false);
  });

  it("ignores the space around a search the job seeker typed", () => {
    expect(ApplicationListParams.parse({ search: "  shopee " }).search).toBe("shopee");
  });
});

describe("sorting the table by a column", () => {
  it("starts a column of text at the top of the alphabet", () => {
    expect(sortedBy(defaultApplicationListParams, "roleTitle")).toMatchObject({
      sort: "roleTitle",
      direction: "asc",
    });
  });

  it("starts the time of the latest Status Change at its newest", () => {
    const byRole = sortedBy(defaultApplicationListParams, "roleTitle");

    expect(sortedBy(byRole, "statusChangedAt")).toMatchObject({
      sort: "statusChangedAt",
      direction: "desc",
    });
  });

  it("turns the table around when it is already sorted by that column", () => {
    const byRole = sortedBy(defaultApplicationListParams, "roleTitle");

    expect(sortedBy(byRole, "roleTitle").direction).toBe("desc");
    expect(sortedBy(sortedBy(byRole, "roleTitle"), "roleTitle").direction).toBe("asc");
  });

  it("leaves what the table is filtered down to alone", () => {
    const filtered: ApplicationListParams = {
      ...defaultApplicationListParams,
      search: "intern",
      status: ["offer"],
    };

    expect(sortedBy(filtered, "company")).toMatchObject({ search: "intern", status: ["offer"] });
  });
});

describe("whether the table is narrowed down", () => {
  it("is not, while it shows what it shows to begin with", () => {
    expect(isFiltered(defaultApplicationListParams)).toBe(false);
  });

  it("is not for sorting, which leaves the same Applications in another order", () => {
    expect(isFiltered({ ...defaultApplicationListParams, sort: "company" })).toBe(false);
  });

  it.each<Partial<ApplicationListParams>>([
    { search: "intern" },
    { status: ["offer"] },
    { source: ["referral"] },
    { company: ["4f1e8e1a-0b7e-4a1f-9c3d-2b6a1f0e7d55"] },
    { activeOnly: false },
  ])("is, once %o is asked for", (asked) => {
    expect(isFiltered({ ...defaultApplicationListParams, ...asked })).toBe(true);
  });
});

/** A query string read back the way the API reads one off a request. */
function parametersIn(queryString: string): Record<string, string> {
  const pairs = queryString
    .split("&")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const separator = pair.indexOf("=");
      return [
        decodeURIComponent(pair.slice(0, separator)),
        decodeURIComponent(pair.slice(separator + 1)),
      ] as const;
    });
  return Object.fromEntries(pairs);
}

describe("the list parameters as a query string", () => {
  it("asks for nothing when the parameters are the ones the API already defaults to", () => {
    expect(applicationListQuery(defaultApplicationListParams)).toBe("");
  });

  it("carries every parameter, so the API reads back exactly what was asked for", () => {
    const params: ApplicationListParams = {
      search: "backend intern",
      status: ["applied", "offer"],
      source: ["linkedin"],
      company: ["4f1e8e1a-0b7e-4a1f-9c3d-2b6a1f0e7d55"],
      activeOnly: false,
      sort: "company",
      direction: "asc",
    };

    const queryString = applicationListQuery(params);

    expect(ApplicationListParams.parse(parametersIn(queryString))).toEqual(params);
  });
});
