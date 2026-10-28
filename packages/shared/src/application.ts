import { z } from "zod";
import { Status } from "./status";

/** Where a job seeker found an Application's posting. */
export const Source = z.enum([
  "linkedin",
  "mycareersfuture",
  "company-website",
  "referral",
  "career-fair",
  "other",
]);
export type Source = z.infer<typeof Source>;

/** An employer the job seeker has one or more Applications with. */
export const Company = z.object({ id: z.uuid(), name: z.string() }).meta({ id: "Company" });
export type Company = z.infer<typeof Company>;

/** A Company's name, as the add, edit and rename forms all ask for it. */
export const CompanyName = z.string().trim().min(1, "Enter the company name.").max(200);

/** What the rename form sends. */
export const CompanyRename = z.object({ name: CompanyName }).meta({ id: "CompanyRename" });
export type CompanyRename = z.infer<typeof CompanyRename>;

/** A dated record that an Application moved to a Status. */
export const StatusChange = z
  .object({
    id: z.uuid(),
    status: Status,
    occurredAt: z.iso.datetime(),
    recordedAt: z.iso.datetime(),
  })
  .meta({ id: "StatusChange" });
export type StatusChange = z.infer<typeof StatusChange>;

/**
 * The Status a Status Change records: what changing an Application's Status sends, and what
 * editing a mistaken Status Change sends.
 */
export const NewStatusChange = z.object({ status: Status }).meta({ id: "NewStatusChange" });
export type NewStatusChange = z.infer<typeof NewStatusChange>;

const summaryFields = {
  id: z.uuid(),
  roleTitle: z.string(),
  company: Company,
  status: Status,
  source: Source.nullable(),
  /** When its latest Status Change happened. */
  statusChangedAt: z.iso.datetime(),
};

/** An Application as a row of the table shows it. */
export const ApplicationSummary = z.object(summaryFields).meta({ id: "ApplicationSummary" });
export type ApplicationSummary = z.infer<typeof ApplicationSummary>;

/** A Company with every Application the job seeker has made there: the Company view. */
export const CompanyWithApplications = Company.extend({
  applications: z.array(ApplicationSummary),
}).meta({ id: "CompanyWithApplications" });
export type CompanyWithApplications = z.infer<typeof CompanyWithApplications>;

/** One Application with its details and its Status history, newest Status Change first. */
export const Application = z
  .object({
    ...summaryFields,
    postingLink: z.string().nullable(),
    location: z.string().nullable(),
    pay: z.string().nullable(),
    jobDescription: z.string().nullable(),
    statusChanges: z.array(StatusChange),
  })
  .meta({ id: "Application" });
export type Application = z.infer<typeof Application>;

/** An Application is saved before applying, or added once already applied for. */
export const InitialStatus = Status.extract(["saved", "applied"]);
export type InitialStatus = z.infer<typeof InitialStatus>;

const detailFields = {
  roleTitle: z.string().trim().min(1, "Enter the role title.").max(200),
  companyName: CompanyName,
  source: Source.nullable().default(null),
  postingLink: z
    .url({ protocol: /^https?$/, error: "Enter a link starting with http:// or https://." })
    .max(2000)
    .nullable()
    .default(null),
  location: z.string().trim().max(200).nullable().default(null),
  pay: z.string().trim().max(200).nullable().default(null),
  jobDescription: z.string().max(20_000).nullable().default(null),
};

/**
 * What the edit form sends: every detail of an Application, all of it at once, with a field
 * the job seeker left blank arriving as `null`. The Status is not a detail; it is wherever
 * the Application's Status Changes put it.
 */
export const ApplicationDetails = z.object(detailFields).meta({ id: "ApplicationDetails" });
export type ApplicationDetails = z.infer<typeof ApplicationDetails>;

/**
 * What the add form sends. Only the role title, the company name and the starting Status are
 * asked for; a field the job seeker left blank arrives as `null`.
 */
export const NewApplication = z
  .object({ ...detailFields, status: InitialStatus })
  .meta({ id: "NewApplication" });
export type NewApplication = z.infer<typeof NewApplication>;
