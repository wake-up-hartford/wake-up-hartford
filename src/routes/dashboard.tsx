import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Trees, HeartHandshake, FileText, ChevronRight, Phone, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { listMyPlans } from "@/lib/stabilization-plan.functions";



export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Wake Up Wednesday" },
      { name: "description", content: "Your dashboard: look up your home, your neighborhood, and your life — in plain language, with a path forward." },
      { property: "og:title", content: "Your Dashboard — Wake Up Wednesday" },
      { property: "og:description", content: "Your dashboard: look up your home, your neighborhood, and your life." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { user } = useAuth();
  const fetchPlans = useServerFn(listMyPlans);
  const { data: plansData } = useQuery({
    queryKey: ["my-plans"],
    queryFn: () => fetchPlans({}),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile-greeting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const firstName = profile?.first_name?.trim() || getFirstName(user);

  const latest = plansData?.plans[0] as { id: string; totalSteps?: number; doneSteps?: number } | undefined;
  const pct = latest && latest.totalSteps ? Math.round(((latest.doneSteps ?? 0) / latest.totalSteps) * 100) : null;

  return (
    <AppShell>
      <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none tracking-tight">
        {user ? "Welcome back," : "Welcome,"}
        <span className="block font-script text-5xl normal-case leading-none text-pink">
          <span className="relative inline-block">
            {user && firstName ? firstName : "neighbor"}
            <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-1 left-0 h-2.5 w-full text-pink">
              <path d="M2 9 C 60 2, 140 2, 198 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      </h1>
      <p className="mt-3 text-[12.5px] leading-snug text-foreground/80">
        This app is built for Hartford residents — to help you understand your home, your neighborhood, and your options. Then take ACTION to make change.
      </p>

      <p className="mb-2 mt-4 text-[14px] font-semibold text-foreground/85">Tap one to get started:</p>
      <div className="grid grid-cols-3 gap-2.5">
        <PillarCard
          num="01" to={latest ? undefined : "/life"} planId={latest?.id}
          icon={HeartHandshake} title="Your Life" body="Stability, health, safety" tone="life" time="~5–8 min"
          progress={pct}
        />
        <PillarCard num="02" to="/home" icon={Building2} title="Your Home" body="Code issues & landlords" tone="home" time="~30 sec" />
        <PillarCard num="03" to="/neighborhood" icon={Trees} title="Your Block" body="Report card for your neighborhood" tone="block" time="~1 min" />
      </div>


      <div className="mt-10 flex justify-center border-t border-border pt-6">
        {!user ? (
          <Link to="/auth" className="pop-btn inline-flex items-center justify-center rounded-full bg-pink px-8 py-3 text-[14px] font-bold text-primary-foreground hover:opacity-90">
            Register to stay in touch
          </Link>
        ) : (
          <Link to="/profile" className="pop-btn inline-flex items-center justify-center rounded-full bg-pink px-8 py-3 text-[14px] font-bold text-primary-foreground hover:opacity-90">
            See Your Profile
          </Link>
        )}
      </div>

      <h3 className="mb-3 mt-10 border-t border-border pt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick Tools</h3>
      <div className="grid grid-cols-2 gap-3">
        <ToolCard to="/landlord-letter" icon={FileText} label="Repair Letter" sub="Request needed repairs from your landlord." />
        <ToolCard to="/security-deposit-letter" icon={FileText} label="Security Deposit Letter" sub="Get your deposit back." />
        <ToolCard href="tel:211" icon={Phone} label="Crisis & 211 Help" sub="Get immediate support and local resources." />
        <ToolCard to="/find-help" icon={LifeBuoy} label="Find Local Help" sub="Connect with trusted Hartford organizations." />
      </div>
      <Footer />
      <Link to="/about" className="mt-4 block text-center text-[13px] text-muted-foreground underline hover:text-foreground">
        About This Tool
      </Link>
    </AppShell>
  );
}

// Pillar card tones — same pairings as the Start page circles
const PILLAR_TONES = {
  life: { bg: "bg-accent", fg: "text-primary-foreground", soft: "text-primary-foreground/85", softer: "text-primary-foreground/80", shadow: "var(--pink)" },
  home: { bg: "bg-primary", fg: "text-primary-foreground", soft: "text-primary-foreground/75", softer: "text-primary-foreground/70", shadow: "var(--gold)" },
  block: { bg: "bg-gold", fg: "text-primary-foreground", soft: "text-primary-foreground/85", softer: "text-primary-foreground/80", shadow: "var(--accent)" },
} as const;

function PillarCard({
  num, to, planId, title, body, progress, time, tone,
  titleClass = "text-[17px] sm:text-xl",
}: {
  num: string; to?: "/home" | "/neighborhood" | "/life"; planId?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; time: string; tone: keyof typeof PILLAR_TONES;
  progress?: number | null; titleClass?: string;
}) {
  const t = PILLAR_TONES[tone];
  const inner = (
    <div
      className={`pillar-card flex h-full flex-col rounded-2xl p-3 sm:p-4 ${t.bg}`}
      style={{ "--pop-shadow": t.shadow } as React.CSSProperties}
    >
      <p className={`font-display font-extrabold uppercase leading-tight tracking-tight break-words flex min-h-[43px] items-end sm:min-h-[56px] ${t.fg} ${titleClass}`}><span>{title.split(" ")[0]}<br />{title.split(" ").slice(1).join(" ")}</span></p>
      <p className={`mt-0.5 min-h-[2.4em] text-[11px] leading-snug ${t.soft} sm:text-[13px]`}>{body}</p>
      {progress != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-pop-border/15" aria-label={`Plan ${progress}% complete`}>
          <div className="h-full" style={{ width: `${progress}%`, background: t.shadow }} />
        </div>
      )}
      <div className={`mt-auto flex items-center justify-between pt-2 text-[11px] ${t.softer} sm:text-[13px]`}>
        <span>{time}</span>
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </div>
    </div>
  );
  if (planId) return <Link to="/plan/$planId" params={{ planId }} className="block">{inner}</Link>;
  return <Link to={to!} className="block">{inner}</Link>;
}

function ToolCard({
  to, href, icon: Icon, label, sub,
}: { to?: "/landlord-letter" | "/security-deposit-letter" | "/find-help"; href?: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; sub: string }) {
  const cls = "tool-card flex items-start gap-2 rounded-xl bg-card px-3 py-2.5";
  const body = (<>
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" strokeWidth={2.5} />
    <span className="min-w-0">
      <span className="block text-[13px] font-semibold leading-tight text-card-foreground">{label}</span>
      <span className="mt-0.5 block text-[11px] leading-snug text-card-foreground/70">{sub}</span>
    </span>
  </>);
  return href ? <a href={href} className={cls}>{body}</a> : <Link to={to!} className={cls}>{body}</Link>;
}

function Footer() {
  return (
    <footer className="mt-12 space-y-3 text-center text-[13px] text-foreground/70">
      <p>Presented by <strong className="font-semibold text-foreground">Greater Hartford Branch NAACP</strong></p>
      <p>Data partnership with CT Data Collaborative</p>
    </footer>
  );
}
