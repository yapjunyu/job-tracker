import { expect, it } from "vitest";
import { startTestApp } from "./test-app";

it("publishes an OpenAPI spec generated from the shared Zod schemas", async () => {
  const app = await startTestApp();

  const response = await app.request("/api/openapi.json");

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    openapi: "3.1.0",
    paths: {
      "/api/health": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: { status: { type: "string", enum: ["ok"] } },
          required: ["status"],
        },
      },
    },
  });
});
