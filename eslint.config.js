import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/dist",
    "**/routeTree.gen.ts",
    "playwright-report",
    "test-results",
    "blob-report",
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: { allowDefaultProject: ["eslint.config.js"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["packages/web/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // TanStack Router's redirects and not-found signals are made to be thrown.
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            { from: "package", package: "@tanstack/router-core", name: "Redirect" },
            { from: "package", package: "@tanstack/router-core", name: "NotFoundError" },
          ],
        },
      ],
    },
  },
  {
    // Route files export a `Route`, and the router plugin splits out their components for hot
    // reload; shadcn/ui components export their variants alongside the component.
    files: ["packages/web/src/routes/**", "packages/web/src/components/ui/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
);
