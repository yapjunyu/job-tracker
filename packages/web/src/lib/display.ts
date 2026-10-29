import type { ApplicationSort, Source, Status } from "@job-tracker/shared";

/** The Statuses as GLOSSARY.md names them. */
export const statusLabels: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  assessment: "Assessment",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  declined: "Declined",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** The Sources as GLOSSARY.md names them. */
export const sourceLabels: Record<Source, string> = {
  linkedin: "LinkedIn",
  mycareersfuture: "MyCareersFuture",
  "company-website": "Company website",
  referral: "Referral",
  "career-fair": "Career fair",
  other: "Other",
};

/** The columns the table can be sorted by, as its headers name them. */
export const sortLabels: Record<ApplicationSort, string> = {
  roleTitle: "Role",
  company: "Company",
  status: "Status",
  source: "Source",
  statusChangedAt: "Last change",
};

// Times are stored in UTC and shown in whatever time zone the browser is in.
const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dayAndTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDay(isoTime: string): string {
  return dayFormat.format(new Date(isoTime));
}

export function formatDayAndTime(isoTime: string): string {
  return dayAndTimeFormat.format(new Date(isoTime));
}
