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

const msPerDay = 24 * 60 * 60 * 1000;

/**
 * How long ago something happened, in whole days. A job search is read in "how long has this
 * one been quiet", not in dates, and it is the same reading the Ghosted label will be made
 * of; the exact date stays a hover away wherever this is shown.
 */
export function formatAge(isoTime: string, now: Date = new Date()): string {
  // Whole days apart, counted from midnight, so something from late yesterday reads as
  // "Yesterday" rather than as a number of hours.
  const then = new Date(isoTime);
  const startOf = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startOf(now) - startOf(then)) / msPerDay);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 31) return `${days.toString()} days`;
  const months = Math.round(days / 30.44);
  if (months < 12) return `${months.toString()} ${months === 1 ? "month" : "months"}`;
  const years = Math.round(days / 365.25);
  return `${years.toString()} ${years === 1 ? "year" : "years"}`;
}

/** The same age as part of a sentence: "today", "yesterday", "5 days ago". */
export function formatAgePhrase(isoTime: string, now: Date = new Date()): string {
  const age = formatAge(isoTime, now);
  if (age === "Today") return "today";
  if (age === "Yesterday") return "yesterday";
  return `${age} ago`;
}

export function formatDayAndTime(isoTime: string): string {
  return dayAndTimeFormat.format(new Date(isoTime));
}
