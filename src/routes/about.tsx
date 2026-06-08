import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About This Tool — Wake Up Wednesday" },
      { name: "description", content: "Learn about the Wake Up Wednesday tool from the Greater Hartford Branch NAACP." },
      { property: "og:title", content: "About This Tool — Wake Up Wednesday" },
      { property: "og:description", content: "Learn about the Wake Up Wednesday tool from the Greater Hartford Branch NAACP." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display text-3xl text-foreground">About This Tool</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">
        Content coming soon.
      </p>
    </AppShell>
  );
}
