import { createContext, useContext } from "react";

/** The app's one way of opening the Add Application form, which the app shell holds. */
export const QuickAdd = createContext<(() => void) | null>(null);

/**
 * Opens quick add from wherever the job seeker is. The form belongs to the app shell rather
 * than to any one page, so the command palette, the button in the header band and the empty
 * state all open the same one, and saving never takes anybody off the page they were on.
 */
export function useQuickAdd(): () => void {
  const open = useContext(QuickAdd);
  // Every page of the app is inside the shell, so there is nothing a page can do about this.
  if (!open) throw new Error("Quick add is only reachable inside the signed-in app.");
  return open;
}
