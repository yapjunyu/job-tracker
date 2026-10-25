import { randomUUID } from "node:crypto";
import type { TestApp } from "./test-app";

export interface Credentials {
  email: string;
  password: string;
}

/** An email address nobody has signed up with yet, and a password for it. */
export function newCredentials(email = `${randomUUID()}@example.com`): Credentials {
  return { email, password: "correct horse battery staple" };
}

// Requests come from the app's own origin, as the web app's do in a browser. Better Auth
// refuses sign-ins and signed-in changes from any other origin.
const origin = "http://localhost";

function post(app: TestApp, path: string, options: { body?: object; cookie?: string } = {}) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    body: JSON.stringify(options.body ?? {}),
  });
}

export function signUp(app: TestApp, credentials: Credentials) {
  // Better Auth requires a name, but the web app doesn't ask for one.
  return post(app, "/api/auth/sign-up/email", { body: { name: "", ...credentials } });
}

export function signIn(app: TestApp, credentials: Credentials) {
  return post(app, "/api/auth/sign-in/email", { body: credentials });
}

export function signOut(app: TestApp, cookie: string) {
  return post(app, "/api/auth/sign-out", { cookie });
}

/** The Cookie header a browser sends back once it has stored this response's cookies. */
export function cookieFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";", 1)[0])
    .join("; ");
}

/** Signs up someone new and returns the Cookie header that keeps them signed in. */
export async function signUpSomeone(app: TestApp): Promise<string> {
  const response = await signUp(app, newCredentials());
  if (!response.ok) throw new Error(`Sign-up failed with ${response.status}`);
  return cookieFrom(response);
}
