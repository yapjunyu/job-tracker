/** What the API said went wrong, or `fallback` when it didn't say. */
export async function failureMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // A response that isn't JSON has nothing to tell the job seeker.
  }
  return fallback;
}
