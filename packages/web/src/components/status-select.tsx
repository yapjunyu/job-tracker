import { Status } from "@job-tracker/shared";
import { cn } from "cn";
import type { Ref } from "react";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabels } from "@/lib/display";

/**
 * A Status that changes in one action: the badge opens a list of every Status, since any can
 * follow any other, and picking one sends it. Picking the Status already shown sends nothing.
 */
export function StatusSelect({
  status,
  label,
  onChange,
  triggerRef,
  inTable = false,
}: {
  status: Status;
  /** Names what the Status belongs to, for anyone who can't see the row or page around it. */
  label: string;
  onChange: (status: Status) => void;
  /** The badge itself, so the table's `s` shortcut can open the list it opens. */
  triggerRef?: Ref<HTMLButtonElement>;
  /** In a table the chevron waits for the row; on its own the badge has to declare itself. */
  inTable?: boolean;
}) {
  return (
    <Select
      value={status}
      items={statusLabels}
      onValueChange={(picked) => {
        if (picked && picked !== status) onChange(picked);
      }}
    >
      <SelectTrigger
        ref={triggerRef}
        size="sm"
        aria-label={label}
        className={cn(
          "-ml-1.5 border-transparent bg-transparent px-1 shadow-none hover:border-input hover:bg-card dark:bg-transparent",
          // Down a whole Status column the chevron is just noise, so where there is a
          // pointer that can hover it waits for the row. Anywhere else — a touch screen,
          // the Status history on the detail page — it stays put, because a badge that
          // looks inert is a badge nobody presses.
          inTable &&
            "[&_svg]:transition-opacity hover:[&_svg]:opacity-100 focus-visible:[&_svg]:opacity-100 in-[tr:focus-visible]:[&_svg]:opacity-100 in-[tr:hover]:[&_svg]:opacity-60 aria-expanded:[&_svg]:opacity-100 pointer-fine:[&_svg]:opacity-0",
        )}
      >
        <SelectValue>{(value: Status) => <StatusBadge status={value} />}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {Status.options.map((option) => (
          <SelectItem key={option} value={option}>
            <StatusBadge status={option} animateChange={false} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
