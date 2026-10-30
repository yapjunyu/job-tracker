import { cn } from "cn";

/**
 * The app's mark: two rows of a list, the lower one current. There is no logo asset, so the
 * mark is drawn here rather than imported, and it takes its colour from the accent.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 22"
      className={cn("size-[22px] shrink-0 text-primary", className)}
      role="img"
      aria-label="job-tracker"
    >
      <rect width="22" height="22" rx="6.5" fill="currentColor" />
      <g fill="#fff">
        <circle cx="7" cy="7.6" r="1.6" opacity="0.5" />
        <rect x="10.4" y="6.5" width="6.2" height="2.2" rx="1.1" opacity="0.5" />
        <circle cx="7" cy="14.4" r="1.6" />
        <rect x="10.4" y="13.3" width="6.2" height="2.2" rx="1.1" />
      </g>
    </svg>
  );
}
