import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/components/applications-page";

export const Route = createFileRoute("/_app/board")({ component: Board });

function Board() {
  return <ApplicationsPage board />;
}
