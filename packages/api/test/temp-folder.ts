import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onTestFinished } from "vitest";

/** An empty folder that is removed when the current test finishes. */
export async function createTempFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "job-tracker-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  return folder;
}
