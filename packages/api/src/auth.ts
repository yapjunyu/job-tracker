import type { User } from "@job-tracker/shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppConfig } from "./app";
import type { Database } from "./database/database";
import * as schema from "./database/schema";

/** What handlers behind `requireSignIn` can read from the context. */
export interface SignedIn {
  Variables: { user: User };
}

const thirtyDaysInSeconds = 60 * 60 * 24 * 30;

/**
 * Accounts, sessions and sign-in, built on Better Auth. A session lasts 30 days on each device,
 * counted from when it was last used. With an invite list, only the email addresses on it can
 * get an account, whatever their letter case.
 */
export function createAuth(
  config: Pick<AppConfig, "authSecret" | "appUrl" | "inviteList">,
  database: Database,
) {
  const invited =
    config.inviteList && new Set(config.inviteList.map((email) => email.toLowerCase()));

  const auth = betterAuth({
    appName: "job-tracker",
    // Without one, Better Auth takes the address from each request instead.
    baseURL: config.appUrl ?? undefined,
    secret: config.authSecret,
    database: drizzleAdapter(database, { provider: "pg", schema, usePlural: true }),
    emailAndPassword: { enabled: true },
    session: { expiresIn: thirtyDaysInSeconds },
    advanced: {
      // Requests reach Node over plain HTTP, so an address taken from them is always http://,
      // and a Secure cookie would never come back from a browser on, say, a home network.
      // Behind HTTPS without APP_URL, Better Auth's origin check refuses to sign anyone in,
      // so no cookie goes out without Secure there.
      useSecureCookies: config.appUrl?.startsWith("https://") ?? false,
    },
    databaseHooks: {
      user: {
        create: {
          // Checked as the user is created, so it holds however they sign up.
          before: (user) => {
            if (invited && !invited.has(user.email.toLowerCase())) {
              throw new APIError("FORBIDDEN", {
                code: "INVITE_ONLY",
                message: "Sign-up is invite-only, and this email address isn't on the invite list.",
              });
            }
            return Promise.resolve();
          },
        },
      },
    },
  });

  return {
    /**
     * Better Auth's own endpoints, such as sign-up, sign-in and sign-out. Mount under `/api/auth`.
     * Better Auth documents them itself, so they aren't in the app's OpenAPI spec.
     */
    routes: new Hono().on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw)),

    /** Answers 401 unless someone is signed in, and otherwise gives later handlers the user. */
    requireSignIn: createMiddleware<SignedIn>(async (c, next) => {
      const { headers, response: session } = await auth.api.getSession({
        headers: c.req.raw.headers,
        returnHeaders: true,
      });
      // Better Auth renews a session in use, and clears an expired one, through its cookie.
      for (const cookie of headers.getSetCookie()) {
        c.header("Set-Cookie", cookie, { append: true });
      }
      if (!session) {
        return c.json({ message: "Sign in to continue." }, 401);
      }
      c.set("user", { id: session.user.id, email: session.user.email });
      await next();
    }),
  };
}
