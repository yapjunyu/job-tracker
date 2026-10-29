import type { ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Every shortcut the table answers, in the order a job seeker would reach for them. */
const shortcuts: { keys: string[]; does: string }[] = [
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
 * from anywhere on the table, and the button beside the heading is there for the mouse.
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <Key>?</Key> anywhere on the table to see these again.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.does} className="flex items-baseline justify-between gap-4">
              <dt className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <Key key={key}>{key}</Key>
                ))}
              </dt>
              <dd className="text-right text-muted-foreground">{shortcut.does}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-xs text-foreground">
      {children}
    </kbd>
  );
}
