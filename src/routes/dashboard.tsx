import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Trees, HeartHandshake, FileText, ChevronRight } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { SketchArrow } from "@/components/SketchArrow";
import { useAuth } from "@/hooks/use-auth";
import { listMyPlans } from "@/lib/stabilization-plan.functions";



export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Wake Up Wednesday" },
      { name: "description", content: "Your dashboard: look up your home, your neighborhood, and your life — in plain language, with a path forward." },
      { property: "og:title", content: "Your Dashboard — Wake Up Wednesday" },
      { property: "og:description", content: "Your dashboard: look up your home, your neighborhood, and your life." },
    ],
  }),
  component: DashboardPage,
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

function DashboardPage() {
  const { user, signOut } = useAuth();
  const firstName = getFirstName(user);
  const fetchPlans = useServerFn(listMyPlans);
  const { data: plansData } = useQuery({
    queryKey: ["my-plans"],
    queryFn: () => fetchPlans({}),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const planCount = plansData?.plans.length ?? 0;
  return (

    <AppShell>
      {firstName && (
        <p className="mb-2 text-sm text-foreground/70">Welcome back, {firstName}</p>
      )}

      <h1 className="font-display text-3xl leading-tight">
        <span className="text-primary">See It.</span>{" "}<br />
        <span className="text-gold">Name It.</span>{" "}<br />
        <span className="text-accent">Fix It.</span>
      </h1>
      <p className="mt-5 mb-4 text-[15px] leading-relaxed text-foreground/80">
        This app is built for Hartford residents — to help you understand your home, your neighborhood, and your options. <strong>Then take ACTION to make change.</strong>
      </p>



      <p className="mb-3 text-[14px] font-semibold text-foreground/85">Tap one to get started:</p>
      <div className="grid gap-4">


        <DashLink
          to="/life"
          icon={HeartHandshake}
          title="Your Life"
          body="Resources for stability, health, and safety."
          tone="blue"
        />
        <DashLink
          to="/home"
          icon={Building2}
          title="Your Home"
          body="Look up any Hartford address — code issues, evictions, landlord info."
          tone="purple"
        />
        <DashLink
          to="/neighborhood"
          icon={Trees}
          title="Your Neighborhood"
          body="A report card for your block."
          tone="gold"
        />

      </div>

      {user && planCount > 0 && (
        <Link
          to="/plans"
          className="mt-5 flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 transition active:scale-[0.99]"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] leading-tight text-foreground">My plans</p>
            <p className="text-[12px] text-muted-foreground">
              {planCount === 1 ? "Resume your stabilization plan." : `You have ${planCount} plans. Pick up where you left off.`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}
      {!user ? (
        <div className="mt-8 flex justify-center">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-3 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
          >
            Register to stay in touch
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex justify-center">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            See Your Profile
          </Link>
        </div>
      )}
      <Footer />
      <Link
        to="/about"
        className="mt-4 block text-center text-[13px] text-muted-foreground underline hover:text-foreground"
      >
        About This Tool
      </Link>
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
  to:  "/home" | "/neighborhood" | "/life" | "/plans";
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; tone: Tone; badge?: string;
}) {
  const t = TONES[tone];
  return (
    <Link to={to} className="block">
      <Card className={`flex items-center gap-4 border-l-4 py-3 transition active:scale-[0.99] ${t.border} ${t.shadow}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className={`font-display text-lg leading-tight ${t.title}`}>{title}</h2>
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


function Footer() {
  return (
    <footer className="mt-12 space-y-3 text-center text-[13px] text-foreground/70">
      <p>Presented by <strong className="font-semibold text-foreground">Greater Hartford Branch NAACP</strong></p>
      <p>Data partnership with CT Data Collaborative</p>
    </footer>
  );
}
