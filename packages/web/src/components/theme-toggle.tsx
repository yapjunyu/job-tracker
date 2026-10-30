import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTheme, useTheme } from "@/lib/theme";

/**
 * Light or dark, in one press. The icon is the theme you would be switching to rather than
 * the one you are in: which theme is in force is already obvious from the page around it, so
 * the button spends itself on saying what the press will do.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const Icon = next === "dark" ? MoonIcon : SunIcon;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={`Switch to the ${next} theme`}
      title={`Switch to the ${next} theme`}
      onClick={() => {
        setTheme(next);
      }}
    >
      <Icon />
    </Button>
  );
}
