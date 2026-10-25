import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type MiddlewareHandler } from "hono";

/** Vite names everything under `assets/` by content hash, so a changed file gets a new URL. */
const hashedAssetCaching = "public, max-age=31536000, immutable";
/** Revalidated on every load, so a new deploy reaches browsers straight away. */
const entryPointCaching = "no-cache";

/** Serves the built web app, so pages and API share one origin. */
export function webApp(webDistDir: string) {
  const serveEntryPoint = serveFiles(webDistDir, entryPointCaching, { path: "index.html" });

  return new Hono()
    .use("/assets/*", serveFiles(webDistDir, hashedAssetCaching))
    .use("*", serveFiles(webDistDir, entryPointCaching))
    .get("*", (c, next) => (isPagePath(c.req.path) ? serveEntryPoint(c, next) : next()));
}

/** A page the web app routes itself: not part of the API, and not a file with an extension. */
function isPagePath(path: string): boolean {
  const isApi = path === "/api" || path.startsWith("/api/");
  const isFile = /\.[^/]*$/.test(path);
  return !isApi && !isFile;
}

/** Serves files under `root` with the given caching, or passes the request on if there's no such file. */
function serveFiles(
  root: string,
  cacheControl: string,
  options: { path?: string } = {},
): MiddlewareHandler {
  const serve = serveStatic({ root, ...options });
  return async (c, next) => {
    // A header set in serveStatic's onFound arrives after the response is built, so set it here.
    const result = await serve(c, next);
    if (result instanceof Response) {
      result.headers.set("Cache-Control", cacheControl);
    }
    return result;
  };
}
