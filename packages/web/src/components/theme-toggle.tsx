import { cn } from "cn";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { setThemePreference, type ThemePreference, useTheme } from "@/lib/theme";

const choices: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "system", label: "Match my device", Icon: LaptopIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/**
 * Light, dark, or whatever the device says. All three are shown at once rather than cycled
 * through, so the job seeker can see which one is in force without pressing anything.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5",
        className,
      )}
    >
      {choices.map(({ value, label, Icon }) => {
        const chosen = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={chosen}
            aria-label={label}
            title={label}
            onClick={() => {
              setThemePreference(value);
            }}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-[4px] transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              chosen
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
