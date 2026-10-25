import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { startTestApp } from "./test-app";

/** Stands in for `vite build` output: an HTML entry point plus content-hashed assets. */
async function writeWebDist(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "job-tracker-web-"));
  await mkdir(join(folder, "assets"));
  await writeFile(join(folder, "index.html"), "<!doctype html><title>job-tracker</title>");
  await writeFile(join(folder, "assets", "index-B2x9Qd1v.js"), "console.log('job-tracker');");
  return folder;
}

describe("serving the web app", () => {
  let webDistDir: string;
  beforeEach(async () => {
    webDistDir = await writeWebDist();
    return () => rm(webDistDir, { recursive: true, force: true });
  });

  it("serves the HTML entry point from the same origin as the API, without caching it", async () => {
    const app = await startTestApp({ config: { webDistDir } });

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toContain("<title>job-tracker</title>");
  });

  it("lets browsers cache hashed assets for a year without checking back", async () => {
    const app = await startTestApp({ config: { webDistDir } });

    const response = await app.request("/assets/index-B2x9Qd1v.js");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("answers a deep link to a page with the HTML entry point, so the web app can route it", async () => {
    const app = await startTestApp({ config: { webDistDir } });

    const response = await app.request("/applications/42");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toContain("<title>job-tracker</title>");
  });

  it("answers a missing file with 404 rather than the HTML entry point", async () => {
    const app = await startTestApp({ config: { webDistDir } });

    const response = await app.request("/assets/index-from-an-older-deploy.js");

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("answers an unknown API path with 404 rather than the HTML entry point", async () => {
    const app = await startTestApp({ config: { webDistDir } });

    const response = await app.request("/api/no-such-endpoint");

    expect(response.status).toBe(404);
  });
});
