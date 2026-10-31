import type { UserSettings } from "@job-tracker/shared";
import { get, put } from "./requests";
import type { TestApp } from "./test-app";

export function getSettings(app: TestApp, cookie: string) {
  return get(app, "/api/settings", cookie);
}

export function saveSettings(app: TestApp, cookie: string, body: object) {
  return put(app, "/api/settings", { body, cookie });
}

/** Sets the job seeker's Ghosted threshold, failing the test if the API refused it. */
export async function setGhostedThresholdOrThrow(app: TestApp, cookie: string, days: number) {
  const response = await saveSettings(app, cookie, { ghostedThresholdDays: days });
  if (response.status !== 200) {
    throw new Error(`Setting the Ghosted threshold failed with ${response.status}`);
  }
  return (await response.json()) as UserSettings;
}
