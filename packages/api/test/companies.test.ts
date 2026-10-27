import { describe, expect, it } from "vitest";
import { signUpSomeone } from "./accounts";
import { addApplicationOrThrow, getApplication, newApplication } from "./applications";
import { getCompany, renameCompany, suggestedNames } from "./companies";
import { startTestApp } from "./test-app";

describe("suggesting Companies while typing a company name", () => {
  it("suggests the job seeker's Companies whose names contain what they typed, ignoring case", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    for (const companyName of ["Shopee", "ShopBack", "Grab", "Workshop"]) {
      await addApplicationOrThrow(app, cookie, newApplication({ companyName }));
    }

    expect(await suggestedNames(app, cookie, "shop")).toEqual(["ShopBack", "Shopee", "Workshop"]);
  });

  it("never suggests another job seeker's Companies", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    await addApplicationOrThrow(app, theirs, newApplication({ companyName: "Grab" }));

    expect(await suggestedNames(app, mine, "grab")).toEqual([]);
  });
});

describe("the Company view", () => {
  it("lists every Application the job seeker has made at that Company, and no others", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const backend = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Backend Intern", companyName: "Shopee" }),
    );
    await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Data Intern", companyName: "shopee" }),
    );
    await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ roleTitle: "Mobile Intern", companyName: "Grab" }),
    );

    const response = await getCompany(app, cookie, backend.company.id);

    expect(response.status).toBe(200);
    const company = (await response.json()) as { name: string; applications: object[] };
    expect(company.name).toBe("Shopee");
    expect(company.applications).toHaveLength(2);
    expect(company.applications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ roleTitle: "Backend Intern" }),
        expect.objectContaining({ roleTitle: "Data Intern" }),
      ]),
    );
  });

  it("answers 404 for another job seeker's Company, so its existence stays hidden", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const { company } = await addApplicationOrThrow(app, theirs);

    expect((await getCompany(app, mine, company.id)).status).toBe(404);
  });
});

describe("renaming a Company", () => {
  it("fixes a typo in the name everywhere the Company shows", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { id, company } = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "Shoppe" }),
    );

    const renamed = await renameCompany(app, cookie, company.id, "Shopee");

    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toEqual({ id: company.id, name: "Shopee" });
    expect(await (await getApplication(app, cookie, id)).json()).toMatchObject({
      company: { id: company.id, name: "Shopee" },
    });
  });

  it("refuses a name another of the job seeker's Companies has, ignoring case, and says why", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    await addApplicationOrThrow(app, cookie, newApplication({ companyName: "Shopee" }));
    const { company } = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "Grab" }),
    );

    const renamed = await renameCompany(app, cookie, company.id, "SHOPEE");

    expect(renamed.status).toBe(409);
    expect(await renamed.json()).toEqual({
      message: 'You already have a Company called "Shopee".',
    });
    expect(await (await getCompany(app, cookie, company.id)).json()).toMatchObject({
      name: "Grab",
    });
  });

  it("lets the job seeker change only the letter case of a Company's name", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { company } = await addApplicationOrThrow(
      app,
      cookie,
      newApplication({ companyName: "govtech" }),
    );

    const renamed = await renameCompany(app, cookie, company.id, "GovTech");

    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toEqual({ id: company.id, name: "GovTech" });
  });

  it("allows a name another job seeker's Company has", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    await addApplicationOrThrow(app, theirs, newApplication({ companyName: "Shopee" }));
    const { company } = await addApplicationOrThrow(
      app,
      mine,
      newApplication({ companyName: "Shoppe" }),
    );

    expect((await renameCompany(app, mine, company.id, "Shopee")).status).toBe(200);
  });

  it("refuses a blank name", async () => {
    const app = await startTestApp();
    const cookie = await signUpSomeone(app);
    const { company } = await addApplicationOrThrow(app, cookie);

    expect((await renameCompany(app, cookie, company.id, "   ")).status).toBe(400);
  });

  it("answers 404 for another job seeker's Company, and leaves its name alone", async () => {
    const app = await startTestApp();
    const mine = await signUpSomeone(app);
    const theirs = await signUpSomeone(app);
    const { company } = await addApplicationOrThrow(
      app,
      theirs,
      newApplication({ companyName: "Grab" }),
    );

    expect((await renameCompany(app, mine, company.id, "Mine now")).status).toBe(404);
    expect(await (await getCompany(app, theirs, company.id)).json()).toMatchObject({
      name: "Grab",
    });
  });
});
