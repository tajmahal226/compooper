import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compooper/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
