import { get, put } from "./requests";
import type { TestApp } from "./test-app";

export function searchCompanies(app: TestApp, cookie: string, search: string) {
  return get(app, `/api/companies?${new URLSearchParams({ search }).toString()}`, cookie);
}

export function getCompany(app: TestApp, cookie: string, id: string) {
  return get(app, `/api/companies/${id}`, cookie);
}

export function renameCompany(app: TestApp, cookie: string, id: string, name: string) {
  return put(app, `/api/companies/${id}`, { body: { name }, cookie });
}

/** The names of the Companies a search suggests, in the order it suggests them. */
export async function suggestedNames(app: TestApp, cookie: string, search: string) {
  const response = await searchCompanies(app, cookie, search);
  if (response.status !== 200) {
    throw new Error(`Searching Companies failed with ${response.status}`);
  }
  return ((await response.json()) as { name: string }[]).map((company) => company.name);
}
