import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FileWarning, Zap, Phone, ChevronLeft, Search, MapPin, Play, Share2, ArrowRight, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/building")({
  head: () => ({
    meta: [
      { title: "Your Home — Wake Up Wednesday" },
      { name: "description", content: "Look up any Hartford address. See code violations, evictions, utility shutoffs, and 311 complaints in plain language." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { address, save } = useStoredAddress();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (address && !active) {
      setActive(address);
      setQuery(address);
    }
  }, [address, active]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (!v) return;
    setActive(v);
    save(v);
  };

  const data = active ? lookupAddress(active) : null;

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back home
      </Link>

      <SectionHeader
        eyebrow="Your home"
        title="Look up any Hartford address"
        subtitle="Type a different address anytime — yours, a friend's, a place you might rent."
      />

      <Card className="mb-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="addr" className="block text-sm font-semibold text-foreground">
            Home address
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              id="addr"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="247 Garden Street, Hartford"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              autoComplete="street-address"
              inputMode="text"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            See the report
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </Card>

      {data && (
        <>
          <Card className="mb-5 bg-primary text-primary-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider opacity-70">Showing</p>
                <p className="truncate font-display text-lg">{data.address}</p>
                <p className="text-sm opacity-80">{data.neighborhood} · Built {data.yearBuilt} · {data.units} units</p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-secondary/60 p-1">
              <TabsTrigger value="card" className="py-2 text-xs font-semibold">Report Card</TabsTrigger>
              <TabsTrigger value="story" className="py-2 text-xs font-semibold">Detailed</TabsTrigger>
              <TabsTrigger value="share" className="py-2 text-xs font-semibold">Share</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-4">
              <ReportCard data={data} />
            </TabsContent>
            <TabsContent value="story" className="mt-4">
              <DetailedReport data={data} />
            </TabsContent>
            <TabsContent value="share" className="mt-4">
              <ShareSlideshow data={data} />
            </TabsContent>
          </Tabs>

          <TakeAction />
        </>
      )}
    </AppShell>
  );
}

type Data = ReturnType<typeof lookupAddress>;

function ReportCard({ data }: { data: Data }) {
  const items = [
    {
      label: "Code violations",
      value: data.building.codeViolations.open,
      sub: `${data.building.codeViolations.closed12mo} closed in last year`,
      severity: data.building.codeViolations.open > 2 ? "concern" : data.building.codeViolations.open > 0 ? "watch" : "good",
    },
    {
      label: "Evictions filed",
      value: data.building.evictions.filings12mo,
      sub: `${data.building.evictions.rate} of units`,
      severity: "concern" as const,
    },
    {
      label: "Utility shutoffs",
      value: data.building.utilityShutoffs.count12mo,
      sub: "last 12 months",
      severity: data.building.utilityShutoffs.count12mo > 0 ? "watch" : "good",
    },
    {
      label: "311 complaints",
      value: data.building.complaints311.count12mo,
      sub: data.building.complaints311.topCategory,
      severity: "watch" as const,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <SeverityPill severity={it.severity as "good" | "watch" | "concern"}>{it.label}</SeverityPill>
          <p className="mt-3 font-display text-4xl leading-none text-foreground">{it.value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{it.sub}</p>
        </Card>
      ))}
    </div>
  );
}

function DetailedReport({ data }: { data: Data }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-0.5 h-5 w-5 text-warning-foreground" />
            <div>
              <h2 className="font-display text-xl leading-tight">Code violations</h2>
              <p className="text-sm text-muted-foreground">From Hartford Housing Code Enforcement.</p>
            </div>
          </div>
          <SeverityPill severity={data.building.codeViolations.open > 0 ? "watch" : "good"}>
            {data.building.codeViolations.open} open
          </SeverityPill>
        </div>
        <ul className="divide-y divide-border">
          {data.building.codeViolations.recent.map((v) => (
            <li key={v.date} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{v.description}</p>
                <p className="text-xs text-muted-foreground">{v.date}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${v.status === "Open" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                {v.status}
              </span>
            </li>
          ))}
        </ul>
        <PlainLanguage>
          Open violations mean the city has asked your landlord to fix something. You can call <strong>311</strong> if a problem hasn't been fixed.
        </PlainLanguage>
      </Card>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <h2 className="font-display text-xl leading-tight">Evictions filed</h2>
              <p className="text-sm text-muted-foreground">Court records, last 12 months.</p>
            </div>
          </div>
          <SeverityPill severity="concern">{data.building.evictions.filings12mo} filings</SeverityPill>
        </div>
        <p className="text-2xl font-display">{data.building.evictions.rate} <span className="text-sm font-sans text-muted-foreground">of units</span></p>
        <p className="mt-1 text-sm text-muted-foreground">{data.building.evictions.note}</p>
        <PlainLanguage>
          If you receive a notice to quit, <strong>you have rights</strong>. Free legal help: call <strong>(860) 541-5000</strong>.
        </PlainLanguage>
      </Card>

      <Card>
        <div className="mb-3 flex items-start gap-3">
          <Zap className="mt-0.5 h-5 w-5 text-warning-foreground" />
          <div>
            <h2 className="font-display text-xl leading-tight">Utility shutoffs</h2>
            <p className="text-sm text-muted-foreground">Reported by Eversource and CNG.</p>
          </div>
        </div>
        <p className="text-sm">{data.building.utilityShutoffs.note}</p>
        <PlainLanguage>
          Cold months (Nov–Apr) have shutoff protections if you qualify. Dial <strong>211</strong> for help.
        </PlainLanguage>
      </Card>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl leading-tight">311 complaints nearby</h2>
              <p className="text-sm text-muted-foreground">Most reported: {data.building.complaints311.topCategory}</p>
            </div>
          </div>
          <SeverityPill severity="watch">{data.building.complaints311.count12mo}</SeverityPill>
        </div>
        <ul className="space-y-2">
          {data.building.complaints311.recent.map((c) => (
            <li key={c.date} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{c.type}</span>
              <span className="text-xs text-muted-foreground">{c.date}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ShareSlideshow({ data }: { data: Data }) {
  const slides = [
    { eyebrow: "Wake Up Wednesday", title: data.address, body: `${data.neighborhood} · Hartford` },
    { eyebrow: "Code violations", title: `${data.building.codeViolations.open} open`, body: "From city housing inspectors." },
    { eyebrow: "Evictions filed", title: data.building.evictions.rate, body: data.building.evictions.note },
    { eyebrow: "311 complaints", title: `${data.building.complaints311.count12mo}`, body: `Top issue: ${data.building.complaints311.topCategory}` },
  ];
  const [i, setI] = useState(0);
  const slide = slides[i];

  const handleShare = async () => {
    const text = `${data.address} — ${data.building.codeViolations.open} open code violations, ${data.building.evictions.filings12mo} evictions filed in the last year. See more on Wake Up Wednesday.`;
    if (navigator.share) {
      try { await navigator.share({ title: "Wake Up Wednesday", text, url: window.location.href }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); } catch {}
    }
  };

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-soft">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-70">
            <span>{slide.eyebrow}</span>
            <span>{i + 1} / {slides.length}</span>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <p className="font-display text-5xl leading-tight">{slide.title}</p>
            <p className="mt-3 text-base opacity-90">{slide.body}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider opacity-60">naacp greater hartford · wake up wednesday</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
        >
          ← Prev
        </button>
        <button
          onClick={() => setI((x) => (x + 1) % slides.length)}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
        >
          <Play className="h-3.5 w-3.5" /> Next
        </button>
      </div>

      <Button onClick={handleShare} className="w-full" size="lg">
        <Share2 className="h-4 w-4" /> Share to social or text
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Auto-generated cards you can post to Instagram, Facebook, or send to a neighbor.
      </p>
    </div>
  );
}

function TakeAction() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl leading-tight">Ready to do something?</h3>
          <p className="mt-1 text-sm text-foreground/80">
            Report a problem, get free legal help, or join your neighbors at Unity Plaza.
          </p>
          <Link to="/life" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition active:scale-[0.99]">
            Take action
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlainLanguage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-secondary/70 p-3.5 text-sm leading-relaxed text-secondary-foreground">
      {children}
    </div>
  );
}
