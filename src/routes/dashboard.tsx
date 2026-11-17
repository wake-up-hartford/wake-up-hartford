import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Trees, HeartHandshake, FileText, MapPin, Check, ArrowRight, ChevronRight, Phone, LifeBuoy } from "lucide-react";
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

      <form onSubmit={submit} className="mt-3">
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

      <p className="mb-3 mt-5 text-[14px] font-semibold text-foreground/85">Tap one to get started:</p>
      <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2.5">
        <PillarCard
          num="01" to={latest ? undefined : "/life"} planId={latest?.id}
          icon={HeartHandshake} title="Your Life" body="Stability, health, safety" shadow="var(--pink)" tint="text-pink" time="~5–8 min"
          progress={pct}
        />
        <PillarCard num="02" to="/home" icon={Building2} title="Your Home" body="Code issues & landlords" shadow="var(--gold)" tint="text-gold" time="~30 sec" />
        <PillarCard num="03" to="/neighborhood" icon={Trees} title="Your Neighborhood" body="Report card for your block" shadow="var(--accent)" tint="text-accent" time="~1 min" titleClass="text-[14px] sm:text-lg" />
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
  num, to, planId, title, body, shadow, progress, time,
  titleClass = "text-[17px] sm:text-xl",
}: {
  num: string; to?: "/home" | "/neighborhood" | "/life"; planId?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; shadow: string; tint: string; progress?: number | null; time: string;
  titleClass?: string;
}) {
  const inner = (
    <div
      className="flex h-full flex-col rounded-2xl border-[1.5px] border-pop-border bg-card p-2.5 transition active:translate-x-[2px] active:translate-y-[2px] sm:p-4"
      style={{ boxShadow: `4px 4px 0 ${shadow}` }}
    >
      <p className={`font-display font-extrabold uppercase leading-tight tracking-tight break-words flex min-h-[43px] items-end sm:min-h-[56px] ${titleClass}`} style={{ color: shadow }}><span>{title.split(" ")[0]}<br />{title.split(" ").slice(1).join(" ")}</span></p>
      <p className="mt-0.5 min-h-[2.4em] text-[11px] leading-snug text-card-foreground/75 sm:text-[13px]">{body}</p>
      {progress != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label={`Plan ${progress}% complete`}>
          <div className="h-full" style={{ width: `${progress}%`, background: shadow }} />
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-card-foreground/70 sm:text-[13px]">
        <span>{time}</span>
        <ChevronRight className="h-5 w-5 text-card-foreground" strokeWidth={2.5} />
      </div>
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
