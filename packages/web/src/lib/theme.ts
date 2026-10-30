import { useSyncExternalStore } from "react";

/**
 * Which theme the job seeker asked for. `system` follows the device, which is what someone
 * using the app at a desk at night and on a phone in daylight actually wants.
 */
export type ThemePreference = "system" | "light" | "dark";

export const themePreferences = ["system", "light", "dark"] as const;

/** Shared with the inline script in `index.html`, which applies the theme before first paint. */
export const themeStorageKey = "job-tracker:theme";

const darkQuery =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

function read(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // A browser that refuses storage still gets a working app, following the device.
  }
  return "system";
}

/** What `preference` actually resolves to right now, once the device has had its say. */
export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return darkQuery?.matches ? "dark" : "light";
}

function apply(preference: ThemePreference) {
  document.documentElement.classList.toggle("dark", resolveTheme(preference) === "dark");
}

const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

// The device changing its mind only matters while the job seeker is following it.
darkQuery?.addEventListener("change", () => {
  if (read() === "system") {
    apply("system");
    announce();
  }
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(themeStorageKey, preference);
  } catch {
    // The theme still applies for this visit; it just won't be remembered for the next one.
  }
  apply(preference);
  announce();
}

/** The preference as stored, and what it currently resolves to. */
export function useTheme(): { preference: ThemePreference; resolved: "light" | "dark" } {
  const preference = useSyncExternalStore(subscribe, read, () => "system" as const);
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolveTheme(read()),
    () => "light" as const,
  );
  return { preference, resolved };
}
