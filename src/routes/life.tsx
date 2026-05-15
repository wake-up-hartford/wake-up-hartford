import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, HeartHandshake, Phone } from "lucide-react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { RESOURCES } from "@/lib/mock-data";

export const Route = createFileRoute("/life")({
  head: () => ({
    meta: [
      { title: "Your Life — Wake Up Wednesday" },
      { name: "description", content: "Resources for economic stability, health, and safety in Hartford." },
    ],
  }),
  component: LifePage,
});

function LifePage() {
  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back home
      </Link>

      <SectionHeader
        eyebrow="Your life"
        title="Resources for the road ahead"
        subtitle="Stability, health, and safety — connections to people who can help."
      />

      <Card className="mb-5 border-dashed bg-accent/40">
        <div className="flex items-start gap-3">
          <HeartHandshake className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Coming soon</p>
            <p className="mt-1 text-sm text-foreground">
              We're building a personalized resource finder with the CT Data Collaborative.
              Until then, here's a starter list neighbors have found helpful.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {RESOURCES.map((r) => (
          <Card key={r.title}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg leading-tight">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
              <a
                href={`tel:${r.phone.replace(/\D/g, "")}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Phone className="h-4 w-4" />
                {r.phone}
              </a>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        In an emergency, call <strong className="text-foreground">911</strong>. For non-emergency help, dial <strong className="text-foreground">211</strong>.
      </p>
    </AppShell>
  );
}
