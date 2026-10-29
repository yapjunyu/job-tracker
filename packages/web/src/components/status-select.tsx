import { Status } from "@job-tracker/shared";
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
}: {
  status: Status;
  /** Names what the Status belongs to, for anyone who can't see the row or page around it. */
  label: string;
  onChange: (status: Status) => void;
  /** The badge itself, so the table's `s` shortcut can open the list it opens. */
  triggerRef?: Ref<HTMLButtonElement>;
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
        className="-ml-1.5 border-transparent px-1 hover:border-input dark:bg-transparent"
      >
        <SelectValue>{(value: Status) => <StatusBadge status={value} />}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {Status.options.map((option) => (
          <SelectItem key={option} value={option}>
            <StatusBadge status={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
