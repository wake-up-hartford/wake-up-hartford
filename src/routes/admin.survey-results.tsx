import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/survey-results")({
  head: () => ({
    meta: [
      { title: "Surveys — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Navigate to="/admin/surveys" replace />,
});
