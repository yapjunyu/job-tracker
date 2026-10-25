import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { meQuery } from "@/api/me";

// Sign-in and sign-up live under this route, so someone already signed in goes to the app.
export const Route = createFileRoute("/_signed-out")({
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.query(meQuery)) throw redirect({ to: "/" });
  },
  component: Outlet,
});
