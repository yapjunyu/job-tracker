import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
  CalendarClockIcon,
  KeyboardIcon,
  LayoutListIcon,
  LogOutIcon,
  SettingsIcon,
  SquareKanbanIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { signOut } from "@/api/auth";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Where it goes, once there is somewhere for it to go. */
  to?: "/";
  /** What it will hold, shown while the view it names is still being built. */
  waiting?: string;
}

/**
 * The app's views. The three that aren't built yet keep their place in the order so the
 * navigation doesn't rearrange itself as each one lands, and say so rather than looking
 * broken.
 */
const navigation: NavigationItem[] = [
  { label: "Applications", Icon: LayoutListIcon, to: "/" },
  { label: "Board", Icon: SquareKanbanIcon, waiting: "A column per Status, drag to move" },
  { label: "Upcoming", Icon: CalendarClockIcon, waiting: "Every Round ahead, in date order" },
  { label: "Settings", Icon: SettingsIcon, waiting: "Your Ghosted threshold and account" },
];

/**
 * The navigation and account controls. It is the same component in the sidebar on a wide
 * screen and in the drawer on a phone; `onNavigate` is how the drawer closes itself behind
 * a job seeker who has just gone somewhere.
 */
export function AppSidebar({
  email,
  onNavigate,
  onShowShortcuts,
}: {
  email: string;
  onNavigate?: () => void;
  onShowShortcuts: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <BrandMark />
        <span className="font-semibold tracking-tight text-foreground">job-tracker</span>
      </div>

      <nav aria-label="Views" className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navigation.map(({ label, Icon, to, waiting }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  onClick={onNavigate}
                  activeOptions={{ exact: true }}
                  activeProps={{
                    "data-current": "",
                    "aria-current": "page",
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium text-sidebar-foreground transition-colors outline-none",
                    "hover:bg-accent hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    "data-current:bg-sidebar-accent data-current:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={waiting}
                  className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium text-muted-foreground"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                  <span className="ml-auto rounded-[4px] border border-border px-1 py-px text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                    Soon
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 px-0.5 pb-2.5">
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[0.6875rem] font-semibold text-secondary-foreground uppercase"
          >
            {email.slice(0, 1)}
          </span>
          <span className="min-w-0 truncate text-xs text-muted-foreground" title={email}>
            {email}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Keyboard shortcuts"
            aria-keyshortcuts="?"
            onClick={onShowShortcuts}
          >
            <KeyboardIcon />
          </Button>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

function SignOutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      // Leave nothing of this user's behind for whoever uses the device next.
      queryClient.removeQueries();
      await navigate({ to: "/sign-in" });
    },
  });

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      disabled={signOutMutation.isPending}
      onClick={() => {
        signOutMutation.mutate();
      }}
    >
      <LogOutIcon />
    </Button>
  );
}
