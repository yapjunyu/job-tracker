/**
 * The shape of the table while its rows are on their way, so the page doesn't jump once they
 * land. The widths vary down the column the way real role titles do, so it reads as a table
 * loading rather than as a progress bar.
 */
const widths = ["62%", "45%", "71%", "52%", "67%", "40%", "58%"];

export function TableSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col">
      <span className="sr-only">Loading your Applications…</span>
      <div className="h-9 border-b border-border" />
      {widths.map((width, index) => (
        <div
          key={width + index.toString()}
          className="flex items-center gap-4 border-b border-border px-3 py-2.5 last:border-b-0 sm:px-4"
        >
          <span
            className="h-3.5 flex-1 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
            style={{ maxWidth: width }}
          />
          <span className="h-5 w-20 shrink-0 animate-pulse rounded-[4px] bg-muted motion-reduce:animate-none" />
          <span className="hidden h-3.5 w-24 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none md:block" />
        </div>
      ))}
    </div>
  );
}
