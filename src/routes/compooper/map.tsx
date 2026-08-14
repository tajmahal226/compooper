import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compooper/map")({
  beforeLoad: () => {
    throw redirect({ to: "/map" });
  },
});
