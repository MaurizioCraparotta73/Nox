import { createFileRoute } from "@tanstack/react-router";
import { InstallPage } from "@/components/install-page";

export const Route = createFileRoute("/installa")({
  component: InstallPage,
  head: () => ({
    meta: [{ title: "Installa Nox" }],
  }),
});
