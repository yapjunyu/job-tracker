import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { User } from "@job-tracker/shared";
import type { SignedIn } from "./auth";

const me = createRoute({
  method: "get",
  path: "/me",
  summary: "Get the signed-in user",
  description: "The web app asks this to find out whether someone is signed in.",
  responses: {
    200: {
      description: "The signed-in user",
      content: { "application/json": { schema: User } },
    },
    401: { description: "Nobody is signed in" },
  },
});

export const meRoutes = new OpenAPIHono<SignedIn>().openapi(me, (c) => c.json(c.var.user, 200));
