import { build } from "esbuild";

// Bundles the API and all its dependencies into one file, so the Docker image needs no
// node_modules. A smaller image starts faster when Cloud Run scales up from zero.
await build({
  entryPoints: ["src/main.ts"],
  outfile: "dist/main.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  logLevel: "info",
});
