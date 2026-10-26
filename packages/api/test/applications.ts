import type { Application, NewApplication } from "@job-tracker/shared";
import { get, post } from "./requests";
import type { TestApp } from "./test-app";

/** The least an add form can send: everything else about an Application is optional. */
export function newApplication(overrides: Partial<NewApplication> = {}) {
  return {
    roleTitle: "Software Engineer Intern",
    companyName: "Shopee",
    status: "saved",
    ...overrides,
  };
}

export function addApplication(app: TestApp, cookie: string, body: object) {
  return post(app, "/api/applications", { body, cookie });
}

export function listApplications(app: TestApp, cookie: string) {
  return get(app, "/api/applications", cookie);
}

export function getApplication(app: TestApp, cookie: string, id: string) {
  return get(app, `/api/applications/${id}`, cookie);
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
