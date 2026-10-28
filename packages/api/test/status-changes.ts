import type { Application, Status } from "@job-tracker/shared";
import { post, put, remove } from "./requests";
import type { TestApp } from "./test-app";

export function changeStatus(app: TestApp, cookie: string, id: string, status: string) {
  return post(app, `/api/applications/${id}/status-changes`, { body: { status }, cookie });
}

export function editStatusChange(
  app: TestApp,
  cookie: string,
  id: string,
  statusChangeId: string,
  status: string,
) {
  return put(app, `/api/applications/${id}/status-changes/${statusChangeId}`, {
    body: { status },
    cookie,
  });
}

export function deleteStatusChange(
  app: TestApp,
  cookie: string,
  id: string,
  statusChangeId: string,
) {
  return remove(app, `/api/applications/${id}/status-changes/${statusChangeId}`, cookie);
}

/** Changes an Application's Status, returning the Application as the API gave it back. */
export async function changeStatusOrThrow(
  app: TestApp,
  cookie: string,
  id: string,
  status: Status,
) {
  const response = await changeStatus(app, cookie, id, status);
  if (response.status !== 201) throw new Error(`Changing Status failed with ${response.status}`);
  return (await response.json()) as Application;
}

/** The Status Change at the top of an Application's history, failing the test if it has none. */
export function newestStatusChange(application: Application) {
  const [newest] = application.statusChanges;
  if (!newest) throw new Error("The Application has no Status Changes");
  return newest;
}
