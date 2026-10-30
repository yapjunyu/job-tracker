import type { ReactElement } from "react";
import { useAddApplication } from "@/api/applications";
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
 * Adds an Application without leaving the page. The dialog closes as soon as the row is on
 * screen; if the server then rejects it, the row goes away again and a toast says why.
 */
export function AddApplicationDialog({
  open,
  onOpenChange,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Left out where the dialog is opened from elsewhere, such as the command palette. */
  trigger?: ReactElement;
}) {
  const addApplication = useAddApplication();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an Application</DialogTitle>
          <DialogDescription>
            Only the role title and the Company are needed. Everything else can wait.
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          mode="add"
          pending={addApplication.isPending}
          onSubmit={(details) => {
            addApplication.mutate(details);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
