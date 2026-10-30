import { useSyncExternalStore } from "react";

/** The two themes. There is no third "follow the device" setting to choose: see below. */
export type Theme = "light" | "dark";

/** Shared with the inline script in `index.html`, which applies the theme before first paint. */
export const themeStorageKey = "job-tracker:theme";

const darkQuery =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

/**
 * The theme the job seeker picked, or `null` while they never have. Anything else in storage,
 * such as the "system" this used to write, counts as never having picked one.
 */
function chosen(): Theme | null {
  try {
    const value = localStorage.getItem(themeStorageKey);
    if (value === "light" || value === "dark") return value;
  } catch {
    // A browser that refuses storage still gets a working app, following the device.
  }
  return null;
}

function device(): Theme {
  return darkQuery?.matches ? "dark" : "light";
}

/**
 * The theme in force: the one that was picked, or the device's until one is. The device is
 * the starting point rather than a setting, so the control itself stays a straight choice
 * between light and dark.
 */
function current(): Theme {
  return chosen() ?? device();
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

// The device changing its mind only matters until the job seeker has picked for themselves.
darkQuery?.addEventListener("change", () => {
  if (chosen() !== null) return;
  apply(device());
  announce();
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The theme still applies for this visit; it just won't be remembered for the next one.
  }
  apply(theme);
  announce();
}

/** The theme in force now. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "light" as const);
}
