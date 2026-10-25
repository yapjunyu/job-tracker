import { MockLanguageModelV4 } from "ai/test";
import { expect, it } from "vitest";
import { startTestApp } from "./test-app";

// The AI language model is swapped at the app factory, so extraction tests run against the
// AI SDK's mock model: deterministic and free. Extraction itself arrives in #15.
it("starts with the AI SDK's mock language model in place of an AI provider", async () => {
  const app = await startTestApp({ languageModel: new MockLanguageModelV4() });

  const response = await app.request("/api/health");

  expect(response.status).toBe(200);
});
