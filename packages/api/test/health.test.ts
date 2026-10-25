import { expect, it } from "vitest";
import { startTestApp } from "./test-app";

it("tells Cloud Run's startup probe the app is ready once it has started", async () => {
  const app = await startTestApp();

  const response = await app.request("/api/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
