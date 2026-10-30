import type { Status } from "@job-tracker/shared";
import { cn } from "cn";
import { useState } from "react";
import { statusLabels } from "@/lib/display";

/**
 * One colour pair per Status, grouped by what the Status means rather than by how far along
 * it is: nothing sent yet, waiting on the Company, a live process, a win, an ending you
 * chose, an ending they chose. Every badge also carries its glossary word and a dot, so the
 * Status is never left to colour alone.
 */
const statusStyles: Record<Status, string> = {
  saved: "bg-badge-neutral text-badge-neutral-fg",
  applied: "bg-badge-blue text-badge-blue-fg",
  assessment: "bg-badge-teal text-badge-teal-fg",
  interviewing: "bg-badge-purple text-badge-purple-fg",
  offer: "bg-badge-green text-badge-green-fg",
  // The one filled badge in the app: the Status the whole search is for.
  accepted: "bg-badge-green-solid text-badge-green-solid-fg",
  declined: "bg-badge-slate text-badge-slate-fg",
  rejected: "bg-badge-red text-badge-red-fg",
  withdrawn: "bg-badge-slate text-badge-slate-fg",
};

export function StatusBadge({
  status,
  className,
  /** Off inside the Status list, where every option would otherwise animate as you scroll. */
  animateChange = true,
}: {
  status: Status;
  className?: string;
  animateChange?: boolean;
}) {
  const { justSet, settle } = useJustSet(status, animateChange);

  return (
    <span
      data-status={status}
      onAnimationEnd={settle}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-[4px] px-1.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        justSet && "animate-status-set motion-reduce:animate-none",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {statusLabels[status]}
    </span>
  );
}

/**
 * Whether this Status has just been changed, as opposed to having been that Status since the
 * page loaded: the badge only sets like ink when something actually moved. The comparison
 * happens as the badge renders, and the animation itself says when it is over.
 */
function useJustSet(status: Status, enabled: boolean) {
  const [seen, setSeen] = useState(status);
  const [justSet, setJustSet] = useState(false);

  if (seen !== status) {
    setSeen(status);
    setJustSet(enabled);
  }

  return {
    justSet,
    settle: () => {
      setJustSet(false);
    },
  };
}
