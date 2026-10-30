import type { ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { commandKeyLabel } from "@/lib/shortcuts";

/** Every shortcut the app answers, in the order a job seeker would reach for them. */
const shortcuts: { keys: string[]; does: string }[] = [
  { keys: [commandKeyLabel, "K"], does: "Open the command palette, wherever you are" },
  { keys: ["/"], does: "Search by role title or Company" },
  { keys: ["Esc"], does: "Leave the search field, keeping what you typed" },
  { keys: ["j", "↓"], does: "Move to the next Application" },
  { keys: ["k", "↑"], does: "Move to the previous Application" },
  { keys: ["Enter"], does: "Open the Application you are on" },
  { keys: ["s"], does: "Change its Status" },
  { keys: ["?"], does: "Show these shortcuts" },
];

/**
 * What every shortcut does, so none of them has to be discovered by accident. `?` opens it
 * from anywhere, and the button in the sidebar is there for the mouse.
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Left out where the dialog is opened from elsewhere, such as the sidebar. */
  trigger?: ReactElement;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <Key>?</Key> anywhere in the app to see these again.
          </DialogDescription>
        </DialogHeader>
        <dl className="-mx-1 flex flex-col">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.does}
              className="flex items-center justify-between gap-6 rounded-md px-1 py-1.5"
            >
              <dd className="text-sm text-muted-foreground">{shortcut.does}</dd>
              <dt className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <Key key={key}>{key}</Key>
                ))}
              </dt>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.375rem] items-center justify-center rounded-[4px] border border-border-strong bg-card px-1.5 text-[0.6875rem] font-medium text-foreground shadow-xs">
      {children}
    </kbd>
  );
}
