// The roots of the query keys, kept apart from the queries so Applications and Companies can
// each invalidate the other's without importing one another.

/** The table is this key; one Application is this key followed by its id. */
export const applicationsKey = ["applications"] as const;

/** Every query about Companies starts with this, so one invalidation reaches them all. */
export const companiesKey = ["companies"] as const;
