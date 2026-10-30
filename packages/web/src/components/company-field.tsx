import { Autocomplete } from "@base-ui/react/autocomplete";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { companySuggestionsQuery } from "@/api/companies";
import { Input } from "@/components/ui/input";

interface CompanyFieldProps {
  id: string;
  name: string;
  defaultValue?: string | undefined;
  placeholder?: string;
}

/**
 * A company name input that suggests the job seeker's Companies as they type, so a second
 * role at the same Company lands under the one they already have. It is still free text: a
 * name that matches no Company becomes a new Company when the form is saved.
 */
export function CompanyField({ id, name, defaultValue, placeholder }: CompanyFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  // Typing stays instant; the search catches up with it.
  const search = useDeferredValue(value.trim());
  const suggestions = useQuery({ ...companySuggestionsQuery(search), enabled: search !== "" });
  // Nothing to suggest for an empty field, nor the name already typed exactly.
  const names =
    search === ""
      ? []
      : (suggestions.data ?? []).map((company) => company.name).filter((n) => n !== value);
  // An open popup hides the rest of the dialog from screen readers, so it only counts as
  // open while it has suggestions to show.
  const [open, setOpen] = useState(false);

  return (
    <Autocomplete.Root
      items={names}
      mode="none"
      value={value}
      onValueChange={setValue}
      open={open && names.length > 0}
      onOpenChange={setOpen}
      name={name}
    >
      <Autocomplete.Input
        id={id}
        required
        autoComplete="off"
        render={<Input placeholder={placeholder} />}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} className="isolate z-50">
          <Autocomplete.Popup className="max-h-(--available-height) w-(--anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-border">
            <Autocomplete.List>
              {(company: string) => (
                <Autocomplete.Item
                  key={company}
                  value={company}
                  className="flex cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {company}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
