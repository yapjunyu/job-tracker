import { InitialStatus, NewApplication, Source } from "@job-tracker/shared";
import { useState } from "react";
import type { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sourceLabels, statusLabels } from "@/lib/display";

/** A field the job seeker left blank isn't an empty answer; it's no answer at all. */
function blankToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

type FieldErrors = Partial<Record<keyof NewApplication, string>>;

/** One message per field, so no field shows a pile of complaints about the same value. */
function firstErrorPerField(error: ZodError<NewApplication>): FieldErrors {
  const messages: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    // Every issue from this schema is about one of its own fields.
    if (typeof field === "string" && !(field in messages)) {
      messages[field as keyof NewApplication] = issue.message;
    }
  }
  return messages;
}

// A Source is optional, so the select offers leaving it out.
const noSource = "";
const sourceOptions: Record<string, string> = { [noSource]: "No Source", ...sourceLabels };

interface ApplicationFormProps {
  /** Takes an Application the shared schema accepted. */
  onAdd: (details: NewApplication) => void;
  /** Stops a second submit while the first is on its way. */
  pending: boolean;
}

/**
 * The form for an Application's details, validated with the schema the API validates with,
 * so nothing reaches the server that the job seeker couldn't have been told about first.
 */
export function ApplicationForm({ onAdd, pending }: ApplicationFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});

  function submit(form: FormData) {
    const text = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };

    const details = NewApplication.safeParse({
      roleTitle: text("roleTitle"),
      companyName: text("companyName"),
      status: text("status"),
      source: blankToNull(text("source")),
      postingLink: blankToNull(text("postingLink")),
      location: blankToNull(text("location")),
      pay: blankToNull(text("pay")),
      jobDescription: blankToNull(text("jobDescription")),
    });
    if (!details.success) {
      setErrors(firstErrorPerField(details.error));
      return;
    }
    setErrors({});
    onAdd(details.data);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
      className="flex flex-col gap-5"
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.roleTitle)}>
          <FieldLabel htmlFor="roleTitle">Role title</FieldLabel>
          <Input
            id="roleTitle"
            name="roleTitle"
            placeholder="Software Engineer Intern"
            required
            autoFocus
          />
          {errors.roleTitle && <FieldError>{errors.roleTitle}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(errors.companyName)}>
          <FieldLabel htmlFor="companyName">Company</FieldLabel>
          <Input id="companyName" name="companyName" placeholder="Shopee" required />
          {errors.companyName && <FieldError>{errors.companyName}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.status)}>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Select name="status" defaultValue="saved" items={statusLabels}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {InitialStatus.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <FieldError>{errors.status}</FieldError>}
          </Field>

          <Field data-invalid={Boolean(errors.source)}>
            <FieldLabel htmlFor="source">Source</FieldLabel>
            <Select name="source" defaultValue={noSource} items={sourceOptions}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noSource}>{sourceOptions[noSource]}</SelectItem>
                {Source.options.map((source) => (
                  <SelectItem key={source} value={source}>
                    {sourceLabels[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && <FieldError>{errors.source}</FieldError>}
          </Field>

          <Field data-invalid={Boolean(errors.location)}>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input id="location" name="location" placeholder="Singapore" />
            {errors.location && <FieldError>{errors.location}</FieldError>}
          </Field>

          <Field data-invalid={Boolean(errors.pay)}>
            <FieldLabel htmlFor="pay">Pay</FieldLabel>
            <Input id="pay" name="pay" placeholder="SGD 3,000/month" />
            {errors.pay && <FieldError>{errors.pay}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.postingLink)}>
          <FieldLabel htmlFor="postingLink">Posting link</FieldLabel>
          <Input
            id="postingLink"
            name="postingLink"
            type="url"
            inputMode="url"
            placeholder="https://"
          />
          {errors.postingLink && <FieldError>{errors.postingLink}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(errors.jobDescription)}>
          <FieldLabel htmlFor="jobDescription">Job description</FieldLabel>
          <Textarea
            id="jobDescription"
            name="jobDescription"
            rows={4}
            placeholder="Paste the posting here, so you can re-read it after it's taken down."
          />
          {errors.jobDescription && <FieldError>{errors.jobDescription}</FieldError>}
        </Field>

        <Button type="submit" size="lg" disabled={pending}>
          Add Application
        </Button>
      </FieldGroup>
    </form>
  );
}
