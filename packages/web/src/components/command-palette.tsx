import { Autocomplete } from "@base-ui/react/autocomplete";
import type { LucideIcon } from "lucide-react";
import { SearchIcon } from "lucide-react";
import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/** One thing the palette can do. */
export interface Command {
  /** What it is called, which is also what the job seeker types to find it. */
  label: string;
  Icon: LucideIcon;
  run: () => void;
}

/**
 * Everything the app can do, from one field opened with Ctrl+K on any page. Typing narrows
 * the list, the arrow keys move through it and Enter runs whichever command is highlighted,
 * so nothing in here needs the mouse.
 */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}) {
  // A command that opens a dialog of its own takes the focus with it, so the palette closing
  // behind it must not pull focus back to where the job seeker pressed Ctrl+K. Dismissing the
  // palette without running anything still puts them back where they were.
  const handedOver = useRef(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nowOpen) => {
        if (nowOpen) handedOver.current = false;
        onOpenChange(nowOpen);
      }}
    >
      <DialogContent
        aria-label="Command palette"
        showCloseButton={false}
        finalFocus={() => !handedOver.current}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <Autocomplete.Root items={commands} open inline autoHighlight="always" keepHighlight>
          <Autocomplete.InputGroup className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Autocomplete.Input
              autoFocus
              aria-label="Search commands"
              placeholder="Type a command"
              className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </Autocomplete.InputGroup>

          <div className="max-h-[min(20rem,50dvh)] overflow-y-auto p-1">
            <Autocomplete.Empty className="px-2.5 py-6 text-center text-sm text-muted-foreground">
              No command goes by that name.
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(command: Command) => (
                <Autocomplete.Item
                  key={command.label}
                  value={command}
                  onClick={() => {
                    handedOver.current = true;
                    onOpenChange(false);
                    command.run();
                  }}
                  className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <command.Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {command.label}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </div>
        </Autocomplete.Root>
      </DialogContent>
    </Dialog>
  );
}
