import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The band every page opens with: where you came from, what you are looking at, and what you
 * can do to it. One component, so the three pages can't drift apart.
 */
export function PageHeader({
  title,
  meta,
  actions,
  back,
  children,
  className,
}: {
  title: ReactNode;
  /** A line under the title: a count, a Company, a Status. */
  meta?: ReactNode;
  actions?: ReactNode;
  /** The way back up, on pages that are below the Applications list. */
  back?: { to: "/"; label: string };
  /** Anything that belongs to the band itself, such as the counts row. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border bg-card", className)}>
      <div className="px-4 pt-4 sm:px-6">
        {back && (
          <Link
            to={back.to}
            className="mb-2 -ml-1 inline-flex items-center gap-0.5 rounded-sm py-0.5 pr-1.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeftIcon className="size-4 shrink-0" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-xl leading-tight font-semibold tracking-[-0.01em] text-balance">
              {title}
            </h1>
            {meta && <div className="flex flex-wrap items-center gap-2 text-sm">{meta}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </header>
  );
}
