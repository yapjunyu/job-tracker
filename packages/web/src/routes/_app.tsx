import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/api/auth";
import { meQuery } from "@/api/me";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center justify-between gap-4 border-b px-4">
        <span className="font-semibold tracking-tight">job-tracker</span>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <Outlet />
      <Toaster position="bottom-right" />
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
      size="sm"
      disabled={signOutMutation.isPending}
      onClick={() => {
        signOutMutation.mutate();
      }}
    >
      Sign out
    </Button>
  );
}
