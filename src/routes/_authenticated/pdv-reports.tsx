import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pdv-reports")({
  beforeLoad: () => {
    throw redirect({ to: "/pdv" });
  },
});
