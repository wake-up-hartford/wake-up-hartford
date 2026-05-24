import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Building2, Trees, HeartHandshake, ChevronRight } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { SketchArrow } from "@/components/SketchArrow";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "See It. Name It. Fix It. — Wake Up Wednesday" },
      { name: "description", content: "Real data about your home, your neighborhood, and your life — in plain language, with a path forward. From GREATER HARTFORD BRANCH NAACP." },
    ],
  }),
  component: HomePage,
});

function getFirstName(user: ReturnType<typeof useAuth>["user"]): string | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [meta.first_name, meta.given_name, meta.full_name, meta.name];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().split(/\s+/)[0];
  }
  if (user.email) return user.email.split("@")[0];
  return null;
}

function HomePage() {
  const { user, signOut } = useAuth();
  const firstName = getFirstName(user);
  return (
    <AppShell>
      {firstName && (
        <p className="mb-2 text-sm text-foreground/70">Welcome back, {firstName}</p>
      )}
      <h1 className="font-display text-3xl leading-tight">
        <span className="text-primary">See It.</span>{" "}
        <span className="text-gold">Name It.</span>{" "}
        <span className="text-accent">Fix It.</span>
      </h1>
      <p className="mt-5 mb-4 font-display text-xl leading-snug text-foreground/95">
        Knowledge is where change begins.
      </p>
      <p className="mb-10 text-[15px] leading-relaxed text-foreground/80">
        Real data about your home, your neighborhood, and your life — in plain language, with a path forward.
      </p>

      <div className="grid gap-4">
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
          title="Your Path"
          body="Resources for stability, health, and safety."
          tone="blue"
          
      />
      </div>

      <EventCard />
      {!user ? (
        <Link
          to="/auth"
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
        >
          Sign In
        </Link>
      ) : (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => signOut()}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-secondary/50"
          >
            Log Out
          </button>
        </div>
      )}
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
      <Card className={`flex items-center gap-4 border-l-4 py-3 transition active:scale-[0.99] ${t.border} ${t.shadow}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-display text-lg leading-tight ${t.title}`}>{title}</h3>
            {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{badge}</span>}
          </div>
          <p className="text-sm text-card-foreground/80">{body}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${t.iconBg} ${t.iconText}`}>
            <Icon className="h-6 w-6" />
          </div>
          <SketchArrow className={`h-5 w-7 -rotate-6 ${t.title}`} />
        </div>
      </Card>
    </Link>
  );
}

function EventCard() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15">
      <div className="flex items-start gap-3 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/85">Join us</p>
          <h3 className="font-display text-xl leading-tight text-foreground">Every Wednesday</h3>
          <p className="mt-1 text-sm text-foreground/85">
            Unity Plaza · Barbour Street · Hartford. Coffee, conversation, and your neighbors.
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 space-y-3 text-center text-[13px] text-foreground/70">
      <p>Presented by <strong className="font-semibold text-foreground">GREATER HARTFORD BRANCH NAACP</strong></p>
      <p>Data partnership with CT Data Collaborative</p>
    </footer>
  );
}
