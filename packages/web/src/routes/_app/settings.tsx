import { defaultGhostedThresholdDays, GhostedThresholdDays } from "@job-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GhostIcon } from "lucide-react";
import { useState } from "react";
import { settingsQuery, useSaveSettings } from "@/api/settings";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/settings")({
  // The page opens on the settings as they stand, never on the defaults in their place.
  loader: async ({ context }) => {
    await context.queryClient.query(settingsQuery);
  },
  component: Settings,
});

/**
 * Where a job seeker sets the app to their own search. There is one setting so far: how long a
 * Company has to go quiet before an Application shows the Ghosted label, which fits a slow
 * industry by going up and a fast one by going down.
 */
function Settings() {
  const { data: settings } = useQuery(settingsQuery);
  const saved = settings?.ghostedThresholdDays ?? defaultGhostedThresholdDays;
  const save = useSaveSettings();
  // The field is the job seeker's to type in; `saved` is the threshold the server agreed to.
  const [days, setDays] = useState(String(saved));
  const [showRefusal, setShowRefusal] = useState(false);
  const asked = GhostedThresholdDays.safeParse(Number(days.trim()));
  const changed = !asked.success || asked.data !== saved;

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Settings" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 sm:px-6 sm:py-5">
        <section className="panel">
          <h2 className="label-micro flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <GhostIcon className="size-3.5" aria-hidden />
            Ghosted
          </h2>
          <form
            className="flex flex-col gap-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!asked.success) {
                setShowRefusal(true);
                return;
              }
              setShowRefusal(false);
              save.mutate({ ghostedThresholdDays: asked.data });
            }}
          >
            <Field>
              <FieldLabel htmlFor="ghosted-threshold">Days of silence before Ghosted</FieldLabel>
              <div className="flex items-start gap-2">
                <Input
                  id="ghosted-threshold"
                  // The API takes a whole number of days, 1 to 365, and so does the field.
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  inputMode="numeric"
                  value={days}
                  aria-invalid={showRefusal && !asked.success}
                  className="w-24"
                  onChange={(event) => {
                    setDays(event.target.value);
                    setShowRefusal(false);
                  }}
                />
                <Button type="submit" disabled={!changed || save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
              {showRefusal && !asked.success ? (
                <FieldError>Enter a whole number of days, from 1 to 365.</FieldError>
              ) : (
                <FieldDescription>
                  An Application in Applied, Assessment or Interviewing with no Status Change for
                  this long shows the Ghosted label. The label is never stored, so changing this
                  relabels every Application at once, and it goes the moment a Status Change is
                  recorded.
                </FieldDescription>
              )}
            </Field>
          </form>
        </section>
      </div>
    </main>
  );
}
