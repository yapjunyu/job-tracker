import type { Application } from "@job-tracker/shared";
import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactElement } from "react";
import { useDeleteApplication } from "@/api/applications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Deletes an Application, after asking first because deleting is permanent and there is no
 * archive. The job seeker lands back on the table with the row already gone; if the server
 * rejects the delete, the row comes back and a toast says why.
 */
export function DeleteApplicationDialog({
  application,
  trigger,
}: {
  application: Application;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const deleteApplication = useDeleteApplication(application.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this Application?</DialogTitle>
          <DialogDescription>
            {application.roleTitle} at {application.company.name}, and its whole Status history, go
            for good. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep it</DialogClose>
          <Button
            variant="destructive"
            disabled={deleteApplication.isPending}
            onClick={() => {
              deleteApplication.mutate();
              setOpen(false);
              // Nothing is left here to look at, and the table is where the job seeker was.
              void navigate({ to: "/" });
            }}
          >
            Delete Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
