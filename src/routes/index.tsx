import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Building2, Trees, HeartHandshake } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";

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
      
      <h1 className="font-display text-3xl leading-tight">
        <span className="text-primary">See It.</span>{" "}
        <span className="text-gold">Name It.</span>{" "}
        <span className="text-accent">Fix It.</span>
      </h1>
      <p className="mt-4 mb-3 font-display text-xl leading-snug text-foreground/90">
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
          tone="gold"
        />
        <DashLink
          to="/building"
          icon={Building2}
          title="Your Home"
          body="Look up any Hartford address. Code issues, evictions, utilities."
          tone="purple"
        />
        <DashLink
          to="/life"
          icon={HeartHandshake}
          title="Your Life"
          body="Resources for stability, health, and safety."
          tone="blue"
          badge="Coming soon"
        />
      </div>

      <EventCard />
      <Footer />
    </AppShell>
  );
}

type Tone = "gold" | "purple" | "blue";

const TONES: Record<Tone, { border: string; iconBg: string; iconText: string; title: string; shadow: string }> = {
  gold:   { border: "border-l-gold",    iconBg: "bg-gold/20",    iconText: "text-gold-foreground", title: "text-gold",    shadow: "shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--gold)_55%,transparent)]" },
  purple: { border: "border-l-primary", iconBg: "bg-primary/15", iconText: "text-primary",         title: "text-primary", shadow: "shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]" },
  blue:   { border: "border-l-accent",  iconBg: "bg-accent/15",  iconText: "text-accent",          title: "text-accent",  shadow: "shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent)_55%,transparent)]" },
};

function DashLink({
  to, icon: Icon, title, body, tone, badge,
}: {
  to: "/building" | "/neighborhood" | "/life";
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; tone: Tone; badge?: string;
}) {
  const t = TONES[tone];
  return (
    <Link to={to} className="block">
      <Card className={`flex items-center gap-4 border-l-4 transition active:scale-[0.99] ${t.border} ${t.shadow}`}>
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${t.iconBg} ${t.iconText}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-display text-lg leading-tight ${t.title}`}>{title}</h3>
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
