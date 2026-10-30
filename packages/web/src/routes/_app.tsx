import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { meQuery } from "@/api/me";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandMark } from "@/components/brand-mark";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useShortcuts } from "@/lib/shortcuts";

// The app's own pages live under this route, so only a signed-in user ever sees them.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query(meQuery);
    if (!user) throw redirect({ to: "/sign-in" });
    return { user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  // Every page of the app has a table of Applications on it, so the shortcuts and the list
  // of them belong to the app rather than to the home screen alone.
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useShortcuts((event) => {
    if (event.key !== "?") return;
    event.preventDefault();
    setHelpOpen((open) => !open);
  });

  // On a phone the navigation lives in the drawer, so anything opened from it has to send
  // the drawer away first or it would open behind it.
  const showShortcuts = () => {
    setMenuOpen(false);
    setHelpOpen(true);
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-sidebar-border lg:block">
        <AppSidebar email={user.email} onShowShortcuts={showShortcuts} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-sidebar px-3 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Open the navigation">
                  <MenuIcon />
                </Button>
              }
            />
            <SheetContent>
              <SheetTitle>Navigation</SheetTitle>
              <AppSidebar
                email={user.email}
                onNavigate={() => {
                  setMenuOpen(false);
                }}
                onShowShortcuts={showShortcuts}
              />
            </SheetContent>
          </Sheet>
          <BrandMark className="size-5" />
          <span className="font-semibold tracking-tight">job-tracker</span>
        </header>

        <Outlet />
      </div>

      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      <Toaster position="bottom-right" />
    </div>
  );
}
