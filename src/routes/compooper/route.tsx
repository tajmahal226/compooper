import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compooper")({
  component: () => <Outlet />,
});
