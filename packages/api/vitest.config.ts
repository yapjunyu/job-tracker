import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/postgres-container.ts"],
    testTimeout: 30_000,
  },
});
