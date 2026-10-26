import type { Application } from "@job-tracker/shared";
import { useState, type ReactElement } from "react";
import { useEditApplication } from "@/api/applications";
import { ApplicationForm } from "@/components/application-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Edits an Application's details. The dialog closes as soon as the change is on screen; if
 * the server then rejects it, the details go back to what they were and a toast says why.
 */
export function EditApplicationDialog({
  application,
  trigger,
}: {
  application: Application;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const editApplication = useEditApplication(application.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit this Application</DialogTitle>
          <DialogDescription>
            Correct or fill in any detail. Clearing a field leaves that detail unrecorded.
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          mode="edit"
          application={application}
          pending={editApplication.isPending}
          onSubmit={(details) => {
            editApplication.mutate(details);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
