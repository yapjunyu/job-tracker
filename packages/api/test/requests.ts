import type { TestApp } from "./test-app";

// Requests come from the app's own origin, as the web app's do in a browser. Better Auth
// refuses sign-ins and signed-in changes from any other origin.
const origin = "http://localhost";

export function post(app: TestApp, path: string, options: { body?: object; cookie?: string } = {}) {
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

export function get(app: TestApp, path: string, cookie: string) {
  return app.request(path, { headers: { Cookie: cookie } });
}
