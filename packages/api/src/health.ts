import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HealthResponse } from "@job-tracker/shared";

const health = createRoute({
  method: "get",
  path: "/health",
  summary: "Report that the app has started",
  description:
    "Used as Cloud Run's startup probe. The server only listens once migrations have run, so any response means the app is ready.",
  responses: {
    200: {
      description: "The app is ready for requests",
      content: { "application/json": { schema: HealthResponse } },
    },
  },
});

export const healthRoutes = new OpenAPIHono().openapi(health, (c) =>
  c.json({ status: "ok" as const }, 200),
);
