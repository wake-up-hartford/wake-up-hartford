import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Trees, HeartHandshake, FileText, MapPin, Check, ArrowRight, Phone, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStoredAddress } from "@/lib/address-store";
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
  const firstName = getFirstName(user);
  const navigate = useNavigate();
  const { address: storedAddress } = useStoredAddress();
  const fetchPlans = useServerFn(listMyPlans);
  const { data: plansData } = useQuery({
    queryKey: ["my-plans"],
    queryFn: () => fetchPlans({}),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const { data: profileAddress } = useQuery({
    queryKey: ["profile-address", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("street_address").eq("id", user!.id).maybeSingle();
      return (data?.street_address as string | null) ?? null;
    },
  });
  const savedAddress = storedAddress || profileAddress || "";
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched && savedAddress) setQuery(savedAddress);
  }, [savedAddress, touched]);

  const latest = plansData?.plans[0] as { id: string; totalSteps?: number; doneSteps?: number } | undefined;
  const pct = latest && latest.totalSteps ? Math.round(((latest.doneSteps ?? 0) / latest.totalSteps) * 100) : null;
  const isSaved = !!savedAddress && query === savedAddress;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (v) window.location.assign(`/home?address=${encodeURIComponent(v)}`);
    else navigate({ to: "/home" });
  };

  return (
    <AppShell>
      <div className="rounded-3xl border-[1.5px] border-pop-border bg-plum px-5 py-5 text-plum-foreground shadow-[4px_4px_0_var(--gold)]">
        <h1 className="whitespace-nowrap font-display text-[22px] uppercase leading-tight tracking-tight sm:text-3xl">
          <span className="text-gold">See It.</span>{" "}
          <span className="text-accent">Name It.</span>{" "}
          <span className="text-plum-foreground">Fix It.</span>
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-plum-foreground/80">
          Built for Hartford residents — to understand your home, your neighborhood, and your options. <strong>Then take ACTION to make change.</strong>
        </p>
      </div>

      <h2 className="mt-6 font-display text-2xl uppercase leading-tight">
        {user ? "Welcome back," : "Welcome,"}{" "}
        <span className="font-script normal-case text-primary">{user && firstName ? firstName : "neighbor"}</span>
      </h2>

      <form onSubmit={submit} className="mt-4">
        <label htmlFor="dash-address" className="mb-1.5 block text-[13px] font-semibold text-foreground">
          Enter your Hartford address
        </label>
        <div className="flex items-center gap-2 rounded-full border-[1.5px] border-pop-border bg-card p-1.5 pl-4 shadow-[4px_4px_0_var(--pop-border)]">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="dash-address"
            value={query}
            onChange={(e) => { setTouched(true); setQuery(e.target.value); }}
            placeholder="Start typing your street address..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-card-foreground outline-none placeholder:text-muted-foreground"
          />
          {isSaved && (
            <span className="hidden items-center gap-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <button type="submit" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-4 py-2 text-[13px] font-bold text-gold-foreground hover:opacity-90">
            Your Home <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      <p className="mb-3 mt-7 text-[14px] font-semibold text-foreground/85">Tap one to get started:</p>
      <div className="grid grid-cols-3 gap-3">
        <PillarCard
          num="01" to={latest ? undefined : "/life"} planId={latest?.id}
          icon={HeartHandshake} title="Your Life" body="Stability, health, safety" shadow="var(--accent)" tint="text-accent"
          progress={pct}
        />
        <PillarCard num="02" to="/home" icon={Building2} title="Your Home" body="Code issues & landlords" shadow="var(--primary)" tint="text-primary" />
        <PillarCard num="03" to="/neighborhood" icon={Trees} title="Your Neighborhood" body="Report card for your block" shadow="var(--gold)" tint="text-gold" />
      </div>

      <h3 className="mb-3 mt-8 font-display text-lg uppercase">Quick Tools</h3>
      <div className="grid grid-cols-2 gap-3">
        <ToolCard to="/landlord-letter" icon={FileText} label="Repair Letter" />
        <ToolCard to="/security-deposit-letter" icon={FileText} label="Security Deposit Letter" />
        <ToolCard href="tel:211" icon={Phone} label="Crisis & 211 Help" />
        <ToolCard to="/find-help" icon={LifeBuoy} label="Find Local Help" />
      </div>

      <div className="mt-8 flex justify-center">
        {!user ? (
          <Link to="/auth" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-pop-border bg-gold px-8 py-3 text-[14px] font-bold text-gold-foreground shadow-[4px_4px_0_var(--pop-border)] hover:opacity-90">
            Register to stay in touch
          </Link>
        ) : (
          <Link to="/profile" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-pop-border bg-primary px-8 py-3 text-[14px] font-bold text-primary-foreground shadow-[4px_4px_0_var(--pop-border)] hover:opacity-90">
            See Your Profile
          </Link>
        )}
      </div>
      <Footer />
      <Link to="/about" className="mt-4 block text-center text-[13px] text-muted-foreground underline hover:text-foreground">
        About This Tool
      </Link>
    </AppShell>
  );
}

function PillarCard({
  num, to, planId, icon: Icon, title, body, shadow, tint, progress,
}: {
  num: string; to?: "/home" | "/neighborhood" | "/life"; planId?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; shadow: string; tint: string; progress?: number | null;
}) {
  const inner = (
    <div
      className="flex aspect-square h-full flex-col rounded-2xl border-[1.5px] border-pop-border bg-card p-2.5 transition active:translate-x-[2px] active:translate-y-[2px] sm:p-4"
      style={{ boxShadow: `4px 4px 0 ${shadow}` }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-plum px-2 py-0.5 text-[10px] font-bold text-plum-foreground">{num}</span>
        <Icon className={`h-5 w-5 ${tint}`} />
      </div>
      <p className={`mt-auto font-display font-bold text-[13px] uppercase leading-tight sm:text-base ${tint}`}>{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-card-foreground/75 sm:text-[13px]">{body}</p>
      {progress != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label={`Plan ${progress}% complete`}>
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
  if (planId) return <Link to="/plan/$planId" params={{ planId }} className="block">{inner}</Link>;
  return <Link to={to!} className="block">{inner}</Link>;
}

function ToolCard({
  to, href, icon: Icon, label,
}: { to?: "/landlord-letter" | "/security-deposit-letter" | "/find-help"; href?: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const cls = "flex items-center gap-2 rounded-2xl border-[1.5px] border-pop-border bg-card px-3 py-3 text-[13px] font-semibold text-card-foreground shadow-[3px_3px_0_var(--pop-border)] transition active:translate-x-[2px] active:translate-y-[2px]";
  const body = (<><Icon className="h-4 w-4 shrink-0 text-primary" /><span className="leading-tight">{label}</span></>);
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
