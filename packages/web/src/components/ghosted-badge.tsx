import { cn } from "cn";
import { GhostIcon } from "lucide-react";
import { formatAgePhrase } from "@/lib/display";

/**
 * The Ghosted label: this Application has gone quiet. It is not a Status, so it never looks
 * like one — an outline rather than a filled badge, beside the Status it sits with — and the
 * silence it stands for is a hover away.
 */
export function GhostedBadge({
  /** When its latest Status Change happened, which is how long it has been quiet. */
  since,
  className,
}: {
  since: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] border border-dashed border-border-strong px-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      title={`No Status Change ${formatAgePhrase(since)}`}
    >
      <GhostIcon className="size-3" aria-hidden />
      Ghosted
    </span>
  );
}
