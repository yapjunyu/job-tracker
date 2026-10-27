import { type Company, CompanyRename } from "@job-tracker/shared";
import { useState, type ReactElement } from "react";
import { useRenameCompany } from "@/api/companies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Renames a Company, such as to fix a typo. The dialog closes as soon as the new name is on
 * screen; if the server then rejects it, as it does a name another of the job seeker's
 * Companies has, the old name comes back and a toast says why.
 */
export function RenameCompanyDialog({
  company,
  trigger,
}: {
  company: Company;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const renameCompany = useRenameCompany(company.id);

  function submit(form: FormData) {
    const rename = CompanyRename.safeParse({ name: form.get("name") });
    if (!rename.success) {
      setError(rename.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    renameCompany.mutate(rename.data.name);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename this Company</DialogTitle>
          <DialogDescription>
            Every Application at {company.name} shows the new name.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(new FormData(event.currentTarget));
          }}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="companyNewName">Name</FieldLabel>
              <Input
                id="companyNewName"
                name="name"
                defaultValue={company.name}
                required
                autoFocus
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <Button type="submit" disabled={renameCompany.isPending}>
              Rename
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
