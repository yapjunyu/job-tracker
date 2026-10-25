import { createAuthClient } from "better-auth/client";

// Better Auth's endpoints, under /api/auth on the page's own origin.
const authClient = createAuthClient();

export interface Credentials {
  email: string;
  password: string;
}

/** Messages for Better Auth's error codes whose own wording doesn't suit a job seeker. */
const errorMessages: Partial<Record<string, string>> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "There's already an account with this email address. Sign in instead.",
};

interface AuthError {
  code?: string;
  message?: string;
}

function failure(error: AuthError) {
  return new Error(
    errorMessages[error.code ?? ""] ?? error.message ?? "Something went wrong. Try again.",
  );
}

/** Creates an account and signs into it. */
export async function signUp(credentials: Credentials) {
  // Better Auth requires a name, but job-tracker doesn't ask for one.
  const { error } = await authClient.signUp.email({ name: "", ...credentials });
  if (error) throw failure(error);
}

export async function signIn(credentials: Credentials) {
  const { error } = await authClient.signIn.email(credentials);
  if (error) throw failure(error);
}

export async function signOut() {
  const { error } = await authClient.signOut();
  if (error) throw failure(error);
}
