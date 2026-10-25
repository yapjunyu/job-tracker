import { MockLanguageModelV4 } from "ai/test";
import { expect, it } from "vitest";
import { startTestApp } from "./test-app";

// The AI language model is swapped at the app factory, so extraction tests can run against
// the AI SDK's mock model: deterministic and free. Nothing calls the model until extraction
// arrives in #15; until then this only proves the mock fits the factory's dependency.
it("accepts the AI SDK's mock model as its AI language model", async () => {
  const app = await startTestApp({ languageModel: new MockLanguageModelV4() });

  const response = await app.request("/api/health");

  expect(response.status).toBe(200);
});
