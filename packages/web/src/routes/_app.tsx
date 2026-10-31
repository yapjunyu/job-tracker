import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { KeyboardIcon, MenuIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { meQuery } from "@/api/me";
import { settingsQuery } from "@/api/settings";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandMark } from "@/components/brand-mark";
import { CommandPalette, type Command } from "@/components/command-palette";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { QuickAdd } from "@/lib/quick-add";
import { useCommandKey, useShortcuts } from "@/lib/shortcuts";

// The app's own pages live under this route, so only a signed-in user ever sees them.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query(meQuery);
    if (!user) throw redirect({ to: "/sign-in" });
    // The Ghosted threshold is what labels a change the server hasn't answered yet, so it is
    // on its way before the first Application is shown — and never in the way, since every
    // label the API answers with has already been worked out with it. The Settings page,
    // which has nothing to show without it, waits for it itself.
    void context.queryClient.query(settingsQuery).catch(() => undefined);
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  useShortcuts((event) => {
    if (event.key !== "?") return;
    event.preventDefault();
    setHelpOpen((open) => !open);
  });
  const openQuickAdd = useCallback(() => {
    setQuickAddOpen(true);
  }, []);
  // The palette belongs to the shell too, so Ctrl+K reaches quick add from any page of the
  // app — an Application, a Company — and not only from the table.
  useCommandKey(() => {
    // What a command already opened is the answer to the last Ctrl+K, so a second press must
    // not stack the palette over a half-written form.
    if (quickAddOpen || helpOpen) return;
    setPaletteOpen((open) => !open);
  });

  /** What the palette offers, in the order a job seeker would reach for them. */
  const commands: Command[] = [
    { label: "Add an Application", Icon: PlusIcon, run: openQuickAdd },
    {
      label: "Keyboard shortcuts",
      Icon: KeyboardIcon,
      run: () => {
        setHelpOpen(true);
      },
    },
  ];

  // On a phone the navigation lives in the drawer, so anything opened from it has to send
  // the drawer away first or it would open behind it.
  const showShortcuts = () => {
    setMenuOpen(false);
    setHelpOpen(true);
  };

  return (
    <QuickAdd value={openQuickAdd}>
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

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
        <AddApplicationDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
        <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
        <Toaster position="bottom-right" />
      </div>
    </QuickAdd>
  );
}
