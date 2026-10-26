import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/launcher")({
  beforeLoad: () => {
    throw redirect({
      to: "/apps",
    });
  },
  component: () => null,
});
