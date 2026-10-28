import {
  type Application,
  ApplicationDetails,
  InitialStatus,
  NewApplication,
  Source,
} from "@job-tracker/shared";
import { useState } from "react";
import type { ZodError } from "zod";
import { CompanyField } from "@/components/company-field";
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
function firstErrorPerField(error: ZodError): FieldErrors {
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

type ApplicationFormProps = {
  /** Stops a second submit while the first is on its way. */
  pending: boolean;
} & (
  | {
      /** Adding: a blank form, which also asks which Status to start the Application in. */
      mode: "add";
      onSubmit: (details: NewApplication) => void;
    }
  | {
      /** Editing: the fields start on what the Application holds. Its Status is not a detail. */
      mode: "edit";
      application: Application;
      onSubmit: (details: ApplicationDetails) => void;
    }
);

/**
 * The form for an Application's details, both for adding one and for editing one, validated
 * with the schema the API validates with, so nothing reaches the server that the job seeker
 * couldn't have been told about first.
 */
export function ApplicationForm(props: ApplicationFormProps) {
  const { pending } = props;
  const existing = props.mode === "edit" ? props.application : undefined;
  const [errors, setErrors] = useState<FieldErrors>({});

  function submit(form: FormData) {
    const text = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };
    const details = {
      roleTitle: text("roleTitle"),
      companyName: text("companyName"),
      source: blankToNull(text("source")),
      postingLink: blankToNull(text("postingLink")),
      location: blankToNull(text("location")),
      pay: blankToNull(text("pay")),
      jobDescription: blankToNull(text("jobDescription")),
    };

    // Each mode parses with its own schema, so each handler is handed just what it takes.
    if (props.mode === "add") {
      const added = NewApplication.safeParse({ ...details, status: text("status") });
      if (!added.success) {
        setErrors(firstErrorPerField(added.error));
        return;
      }
      setErrors({});
      props.onSubmit(added.data);
      return;
    }
    const edited = ApplicationDetails.safeParse(details);
    if (!edited.success) {
      setErrors(firstErrorPerField(edited.error));
      return;
    }
    setErrors({});
    props.onSubmit(edited.data);
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
            defaultValue={existing?.roleTitle}
            required
            autoFocus
          />
          {errors.roleTitle && <FieldError>{errors.roleTitle}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(errors.companyName)}>
          <FieldLabel htmlFor="companyName">Company</FieldLabel>
          <CompanyField
            id="companyName"
            name="companyName"
            placeholder="Shopee"
            defaultValue={existing?.company.name}
          />
          {errors.companyName && <FieldError>{errors.companyName}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Only an Application being added takes its Status from this form. After that the
              Status is wherever its Status Changes put it. */}
          {props.mode === "add" && (
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
          )}

          <Field data-invalid={Boolean(errors.source)}>
            <FieldLabel htmlFor="source">Source</FieldLabel>
            <Select name="source" defaultValue={existing?.source ?? noSource} items={sourceOptions}>
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
            <Input
              id="location"
              name="location"
              placeholder="Singapore"
              defaultValue={existing?.location ?? ""}
            />
            {errors.location && <FieldError>{errors.location}</FieldError>}
          </Field>

          <Field data-invalid={Boolean(errors.pay)}>
            <FieldLabel htmlFor="pay">Pay</FieldLabel>
            <Input
              id="pay"
              name="pay"
              placeholder="SGD 3,000/month"
              defaultValue={existing?.pay ?? ""}
            />
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
            defaultValue={existing?.postingLink ?? ""}
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
            defaultValue={existing?.jobDescription ?? ""}
          />
          {errors.jobDescription && <FieldError>{errors.jobDescription}</FieldError>}
        </Field>

        <Button type="submit" size="lg" disabled={pending}>
          {props.mode === "add" ? "Add Application" : "Save changes"}
        </Button>
      </FieldGroup>
    </form>
  );
}
