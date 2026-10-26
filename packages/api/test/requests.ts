import type { TestApp } from "./test-app";

// Requests come from the app's own origin, as the web app's do in a browser. Better Auth
// refuses sign-ins and signed-in changes from any other origin.
const origin = "http://localhost";

function send(
  app: TestApp,
  method: string,
  path: string,
  options: { body?: object; cookie?: string } = {},
) {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    body: JSON.stringify(options.body ?? {}),
  });
}

export function post(app: TestApp, path: string, options: { body?: object; cookie?: string } = {}) {
  return send(app, "POST", path, options);
}

export function put(app: TestApp, path: string, options: { body?: object; cookie?: string } = {}) {
  return send(app, "PUT", path, options);
}

export function get(app: TestApp, path: string, cookie: string) {
  return app.request(path, { headers: { Cookie: cookie } });
}

export function remove(app: TestApp, path: string, cookie: string) {
  return app.request(path, { method: "DELETE", headers: { Origin: origin, Cookie: cookie } });
}
