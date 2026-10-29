import type { Application, ApplicationDetails, NewApplication } from "@job-tracker/shared";
import { get, post, put, remove } from "./requests";
import type { TestApp } from "./test-app";

/** The least an edit form can send. An Application's Status is not a detail, so it isn't here. */
export function applicationDetails(overrides: Partial<ApplicationDetails> = {}) {
  return { roleTitle: "Software Engineer Intern", companyName: "Shopee", ...overrides };
}

/** The least an add form can send: everything else about an Application is optional. */
export function newApplication(overrides: Partial<NewApplication> = {}) {
  return { ...applicationDetails(), status: "saved", ...overrides };
}

export function addApplication(app: TestApp, cookie: string, body: object) {
  return post(app, "/api/applications", { body, cookie });
}

/** Lists the job seeker's Applications, with the table's list parameters as a query string. */
export function listApplications(app: TestApp, cookie: string, query = "") {
  return get(app, query ? `/api/applications?${query}` : "/api/applications", cookie);
}

export function getApplication(app: TestApp, cookie: string, id: string) {
  return get(app, `/api/applications/${id}`, cookie);
}

export function editApplication(app: TestApp, cookie: string, id: string, body: object) {
  return put(app, `/api/applications/${id}`, { body, cookie });
}

export function deleteApplication(app: TestApp, cookie: string, id: string) {
  return remove(app, `/api/applications/${id}`, cookie);
}

/** Adds an Application and returns it as the API gave it back, failing the test if it didn't. */
export async function addApplicationOrThrow(
  app: TestApp,
  cookie: string,
  body: object = newApplication(),
) {
  const response = await addApplication(app, cookie, body);
  if (response.status !== 201) {
    throw new Error(`Adding an Application failed with ${response.status}`);
  }
  return (await response.json()) as Application;
}
