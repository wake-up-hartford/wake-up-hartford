import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Building2, Trees, HeartHandshake } from "lucide-react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "See It. Name It. Fix It. — Wake Up Wednesday" },
      { name: "description", content: "Real data about your home, your neighborhood, and your life — in plain language, with a path forward. From NAACP Greater Hartford." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <SectionHeader
        eyebrow="Wake Up Wednesday"
        title="See It. Name It. Fix It."
      />
      <p className="-mt-3 mb-3 font-display text-xl leading-snug text-foreground/90">
        Knowledge is where change begins.
      </p>
      <p className="mb-7 text-[15px] leading-relaxed text-muted-foreground">
        Real data about your home, your neighborhood, and your life — in plain language, with a path forward.
      </p>

      <div className="grid gap-3">
        <DashLink
          to="/neighborhood"
          icon={Trees}
          title="Your Neighborhood"
          body="A report card for your block — air, schools, safety, access."
          accent
        />
        <DashLink
          to="/building"
          icon={Building2}
          title="Your Home"
          body="Look up any Hartford address. Code issues, evictions, utilities."
        />
        <DashLink
          to="/life"
          icon={HeartHandshake}
          title="Your Life"
          body="Resources for stability, health, and safety."
          badge="Coming soon"
        />
      </div>

      <EventCard />
      <Footer />
    </AppShell>
  );
}

function DashLink({
  to, icon: Icon, title, body, accent, badge,
}: {
  to: "/building" | "/neighborhood" | "/life";
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; accent?: boolean; badge?: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className={`flex items-center gap-4 transition active:scale-[0.99] ${accent ? "border-l-4 border-l-gold" : ""}`}>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg leading-tight">{title}</h3>
            {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{badge}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </Card>
    </Link>
  );
}

function EventCard() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15">
      <div className="flex items-start gap-3 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Join us</p>
          <h3 className="font-display text-xl leading-tight">Every Wednesday</h3>
          <p className="mt-1 text-sm text-foreground/80">
            Unity Plaza · Barbour Street · Hartford. Coffee, conversation, and your neighbors.
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 space-y-2 text-center text-[12px] text-muted-foreground">
      <p>Presented by <strong className="font-semibold text-foreground">NAACP Greater Hartford</strong></p>
      <p>Data partnership with CT Data Collaborative</p>
    </footer>
  );
}
