import { useAddApplication } from "@/api/applications";
import { ApplicationForm } from "@/components/application-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Adds an Application without leaving the page. The app shell holds the one of these there
 * is, and everything that offers quick add opens it through `useQuickAdd`. It closes as soon
 * as the row is on screen; if the server then rejects it, the row goes away again and a toast
 * says why.
 */
export function AddApplicationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addApplication = useAddApplication();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
