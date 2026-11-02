import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/components/applications-page";

export const Route = createFileRoute("/_app/")({ component: ApplicationsPage });
