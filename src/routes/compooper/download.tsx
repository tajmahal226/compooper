import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compooper/download")({
  beforeLoad: () => {
    throw redirect({ to: "/download" });
  },
});
