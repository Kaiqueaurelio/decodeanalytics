import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pdv-admin")({
  beforeLoad: () => {
    throw redirect({ to: "/services" });
  },
});
