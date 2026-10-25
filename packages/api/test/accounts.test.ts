import { describe, expect, it } from "vitest";
import { cookieFrom, newCredentials, signIn, signOut, signUp, signUpSomeone } from "./accounts";
import { startTestApp, type TestApp } from "./test-app";

function getMe(app: TestApp, cookie: string) {
  return app.request("/api/me", { headers: { Cookie: cookie } });
}

describe("accounts", () => {
  it("signs a job seeker up with email and password, and signs them in", async () => {
    const app = await startTestApp();
    const credentials = newCredentials();

    const signedUp = await signUp(app, credentials);

    expect(signedUp.status).toBe(200);
    const me = await getMe(app, cookieFrom(signedUp));
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email: credentials.email });
  });

  it("signs a job seeker in with the email and password they signed up with", async () => {
    const app = await startTestApp();
    const credentials = newCredentials();
    await signUp(app, credentials);

    const signedIn = await signIn(app, credentials);

    expect(signedIn.status).toBe(200);
    const me = await getMe(app, cookieFrom(signedIn));
    expect(await me.json()).toMatchObject({ email: credentials.email });
  });

  it("refuses to sign in with the wrong password", async () => {
    const app = await startTestApp();
    const credentials = newCredentials();
    await signUp(app, credentials);

    const signedIn = await signIn(app, { ...credentials, password: "not the right password" });

    expect(signedIn.status).toBe(401);
    expect(await signedIn.json()).toMatchObject({ message: "Invalid email or password" });
    expect(signedIn.headers.getSetCookie()).toEqual([]);
  });

  it("keeps a job seeker signed in on that device for 30 days", async () => {
    const app = await startTestApp();
    const credentials = newCredentials();
    await signUp(app, credentials);

    const signedIn = await signIn(app, credentials);

    const thirtyDaysInSeconds = 2_592_000;
    expect(signedIn.headers.getSetCookie()).toContainEqual(
      expect.stringContaining(`Max-Age=${thirtyDaysInSeconds}`),
    );
  });

  it("signs a job seeker out, so their session no longer works even from a copy of its cookie", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);

    const signedOut = await signOut(app, cookie);

    expect(signedOut.status).toBe(200);
    expect((await getMe(app, cookie)).status).toBe(401);
  });

  it("answers API requests with 401 when nobody is signed in", async () => {
    const app = await startTestApp();

    const me = await app.request("/api/me");

    expect(me.status).toBe(401);
  });
});

describe("invite list", () => {
  it("leaves sign-up open to any email address when no invite list is configured", async () => {
    const app = await startTestApp({ config: { inviteList: null } });

    const signedUp = await signUp(app, newCredentials("anyone@example.com"));

    expect(signedUp.status).toBe(200);
  });

  it("lets an email address on the invite list sign up, whatever its letter case", async () => {
    const app = await startTestApp({ config: { inviteList: ["invited@example.com"] } });

    const signedUp = await signUp(app, newCredentials("Invited@Example.com"));

    expect(signedUp.status).toBe(200);
  });

  it("rejects sign-up from any other email address with a clear invite-only message", async () => {
    const app = await startTestApp({ config: { inviteList: ["invited@example.com"] } });
    const stranger = newCredentials("stranger@example.com");

    const signedUp = await signUp(app, stranger);

    expect(signedUp.status).toBe(403);
    expect(await signedUp.json()).toMatchObject({
      code: "INVITE_ONLY",
      message: "Sign-up is invite-only, and this email address isn't on the invite list.",
    });
    expect((await signIn(app, stranger)).status).toBe(401);
  });
});
