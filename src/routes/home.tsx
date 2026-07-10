import { createFileRoute, Link } from "@tanstack/react-router";

import { AlertTriangle, FileWarning, Phone, ChevronLeft, ChevronDown, Search, MapPin, Play, Share2, ArrowRight, Megaphone, Printer, Building2, Mail, Briefcase, MessageSquare, Loader2, BarChart3 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BuildingStoryDialog } from "@/components/BuildingStoryDialog";
import { useStoredAddress } from "@/lib/address-store";
import { lookupHartfordAddress, suggestHartfordAddresses, type LookupResult } from "@/lib/address-lookup.functions";
import { getCoverageSummary, refreshCensusTracts } from "@/lib/coverage.functions";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/track-event";

const PickAddressMap = lazy(() =>
  import("@/components/BuildingAddressMap").then((m) => ({ default: m.PickAddressMap })),
);
const AddressLocationMap = lazy(() =>
  import("@/components/BuildingAddressMap").then((m) => ({ default: m.AddressLocationMap })),
);
const AddressStreetView = lazy(() =>
  import("@/components/AddressStreetView").then((m) => ({ default: m.AddressStreetView })),
);

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Your Home — Wake Up Wednesday" },
      { name: "description", content: "Look up any Hartford address. See live code violations and 311 complaints from city open data." },
      { property: "og:title", content: "Your Home — Wake Up Wednesday" },
      { property: "og:description", content: "Look up any Hartford address and see live code violations and 311 complaints in plain language." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/home" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/home" },
    ],
  }),
  component: HomePage,
});

type Found = Extract<LookupResult, { status: "found" }>;

function HomePage() {
  const EXAMPLE_TEXT = "e.g., 555 Main Street, Hartford";
  const { save, clear } = useStoredAddress();
  const [query, setQuery] = useState(EXAMPLE_TEXT);
  const [active, setActive] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [debounced, setDebounced] = useState("");

  const lookup = useServerFn(lookupHartfordAddress);
  const suggest = useServerFn(suggestHartfordAddresses);
  const fetchCoverage = useServerFn(getCoverageSummary);
  const runRefresh = useServerFn(refreshCensusTracts);

  const { data: coverage, refetch: refetchCoverage } = useQuery({
    queryKey: ["coverage-summary"],
    queryFn: () => fetchCoverage(),
    staleTime: 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => runRefresh({ data: {} }),
    onSuccess: () => refetchCoverage(),
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["address-suggest", debounced],
    queryFn: () => suggest({ data: { query: debounced } }),
    enabled: suggestOpen && debounced.length >= 2 && debounced !== EXAMPLE_TEXT,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (seeded) return;
    const fromUrl = new URLSearchParams(window.location.search).get("address");
    if (fromUrl) {
      setActive(fromUrl);
      setQuery(fromUrl);
      save(fromUrl);
    }
    setSeeded(true);
  }, [seeded, save]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (!v || v === EXAMPLE_TEXT) return;
    trackEvent("home_address_submit", { address: v });
    setActive(v);
    save(v);
  };

  const handleReset = () => {
    setActive(null);
    setQuery(EXAMPLE_TEXT);
    setSeeded(true);
    clear();
  };

  const handleFocus = () => {
    if (query === EXAMPLE_TEXT) setQuery("");
    setSuggestOpen(true);
  };

  const pickSuggestion = (s: { display: string; normalized: string }) => {
    setQuery(s.display);
    setSuggestOpen(false);
    trackEvent("home_address_submit", { address: s.display, source: "autocomplete" });
    setActive(s.display);
    save(s.display);
  };

  const { data: result, isLoading } = useQuery({
    queryKey: ["hartford-address", active],
    queryFn: () => lookup({ data: { query: active! } }),
    enabled: !!active,
    staleTime: 60_000,
  });

  const found = result?.status === "found" ? (result as Found) : null;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        {active && (
          <button
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#dfddce] hover:opacity-80 transition-opacity"
          >
            <Search className="h-3.5 w-3.5" /> Look up new address
          </button>
        )}
      </div>

      <Collapsible>
        <div className="mb-4 rounded-lg border border-dashed border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left">
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground" />
              <span className="font-semibold">Beta — partial data.</span>
              <span className="text-muted-foreground">Tap to learn more</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="mt-2 leading-relaxed text-foreground/90">
              We are actively working to connect more city datasets, so what you see here may be incomplete. If something looks missing, it might not be in our records yet.
            </p>
          </CollapsibleContent>
        </div>
      </Collapsible>


      {!active && (
        <>
          <SectionHeader
            eyebrow="Your home"
            title="Look up any Hartford address"
            subtitle="Type an address (yours, a friend's, a place you might rent) or drop a pin on the map."
          />

          <Card className="mb-5">
            <Tabs defaultValue="address" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto bg-secondary/60 p-1 mb-4">
                <TabsTrigger value="address" className="py-1.5 text-xs font-semibold text-foreground data-[state=active]:text-gold">
                  Enter Address
                </TabsTrigger>
                <TabsTrigger value="map" className="py-1.5 text-xs font-semibold text-foreground data-[state=active]:text-gold">
                  Pick on Map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="address">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <label htmlFor="addr" className="block text-sm font-semibold text-foreground">
                    Home address
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <input
                        id="addr"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSuggestOpen(true); }}
                        onFocus={handleFocus}
                        onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                        placeholder=""
                        className={`w-full bg-transparent text-base outline-none ${query === EXAMPLE_TEXT ? "text-muted-foreground/60" : "text-foreground"}`}
                        autoComplete="off"
                        inputMode="text"
                        role="combobox"
                        aria-expanded={suggestOpen && suggestions.length > 0}
                        aria-autocomplete="list"
                      />
                    </div>
                    {suggestOpen && suggestions.length > 0 && (
                      <ul
                        role="listbox"
                        className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg"
                      >
                        {suggestions.map((s) => (
                          <li key={s.normalized}>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
                            >
                              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate">{s.display}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition active:scale-[0.99]"
                  >
                    See the report
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="map">
                <Suspense fallback={<div className="h-[320px] rounded-xl bg-secondary/40 animate-pulse" />}>
                  <PickAddressMap
                    onPick={(addr) => {
                      trackEvent("home_map_address_click", { address: addr });
                      setQuery(addr);
                      setActive(addr);
                      save(addr);
                    }}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </Card>
          <TakeAction />
        </>
      )}


      {active && isLoading && (
        <Card className="mb-5 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Looking up <strong className="text-foreground">{active}</strong> in Hartford city records…</span>
        </Card>
      )}

      {active && !isLoading && !found && (
        <NotFoundState query={active} onReset={handleReset} />
      )}

      {found && (
        <>
          <BuildingStoryDialog data={found} />

          <Card className="mb-5 bg-primary text-primary-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider opacity-70">Showing</p>
                <h1 className="truncate font-display text-lg">{found.address.display}</h1>
                <p className="text-sm opacity-80">Hartford, CT · Year built and unit count not available</p>
              </div>
            </div>
            <div className="mt-3">
              <Suspense fallback={<div className="h-[180px] rounded-xl bg-black/20 animate-pulse" />}>
                <AddressLocationMap address={found.address.display} />
              </Suspense>
            </div>
            <div className="mt-3">
              <Suspense fallback={<div className="h-[180px] rounded-xl bg-black/20 animate-pulse" />}>
                <AddressStreetView address={found.address.display} />
              </Suspense>
            </div>
          </Card>

          <Tabs defaultValue="story" className="w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 ways to view Home data</p>
            <TabsList className="grid w-full grid-cols-3 h-auto bg-secondary/60 p-1">
              <TabsTrigger value="story" className="py-1.5 text-[11px] font-semibold">Report Card</TabsTrigger>
              <TabsTrigger value="share" className="py-1.5 text-[11px] font-semibold">Share</TabsTrigger>
              <TabsTrigger value="print" className="py-1.5 text-[11px] font-semibold">Print</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-4">
              <DetailedReport data={found} />
            </TabsContent>
            <TabsContent value="share" className="mt-4">
              <ShareSlideshow data={found} />
            </TabsContent>
            <TabsContent value="print" className="mt-4">
              <PrintReport data={found} />
            </TabsContent>
          </Tabs>

          <div className="mt-5">
            <LandlordCard data={found} />
          </div>

          <TakeAction />
        </>
      )}
    </AppShell>
  );
}

function NotFoundState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <Card className="mb-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="flex-1">
          <h2 className="font-display text-lg leading-tight">No records found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn't find <strong className="text-foreground">{query}</strong> in Hartford's code enforcement or 311 records.
            Try a different spelling, or just the street number and street name (e.g. "555 Main St").
          </p>
          <Button onClick={onReset} className="mt-4 w-full" size="lg">
            <Search className="h-4 w-4" /> Try another address
          </Button>
        </div>
      </div>
    </Card>
  );
}

type Severity = "good" | "watch" | "concern";

function ExpandableIndicator({
  value,
  label,
  sub,
  severity,
  pillText,
  defaultOpen = false,
  children,
}: {
  value: React.ReactNode;
  label: string;
  sub: string;
  severity: Severity;
  pillText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} asChild>
      <Card className="p-0 overflow-hidden">
        <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-1 text-left sm:px-4 sm:py-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
              <span className="font-display text-2xl leading-none text-foreground sm:text-3xl">{value}</span>
              <span className="text-xs font-semibold text-foreground sm:text-sm">{label}</span>
            </div>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs">{sub}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <SeverityPill severity={severity}>{pillText ?? severity}</SeverityPill>
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/80">
              <span className="group-data-[state=open]:hidden">Expand</span>
              <span className="hidden group-data-[state=open]:inline">Collapse</span>
              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-3 pb-2 pt-1.5 sm:px-4">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DetailedReport({ data }: { data: Found }) {
  const c = data.counts;
  const cvSeverity: Severity = c.violationsOpen > 2 ? "concern" : c.violationsOpen > 0 ? "watch" : "good";
  const ownerLabel = data.address.owner ?? "this owner";

  return (
    <div className="space-y-3">
      <ExpandableIndicator
        value={c.violationsOpen}
        label="Code violations"
        sub={`${c.violationsClosed12mo} closed in last year`}
        severity={cvSeverity}
        pillText={`${c.violationsOpen} open`}
      >
        <div className="mb-2 flex items-start gap-3">
          <FileWarning className="mt-0.5 h-5 w-5 text-warning-foreground" />
          <p className="text-sm text-muted-foreground">From Hartford Housing Code Enforcement.</p>
        </div>
        {data.recentViolations.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">No recent violations on record.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentViolations.map((v, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{v.description || "Violation"}</p>
                  <p className="text-xs text-muted-foreground">{v.date || "Date not recorded"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${v.status === "Open" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                  {v.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <PlainLanguage>
          Open violations mean the city has asked your landlord to fix something. You can call <strong>311</strong> if a problem hasn't been fixed.
          {data.portfolio && (
            <> Across <strong>{data.portfolio.propertiesInHartford}</strong> Hartford properties {ownerLabel} has <strong>{data.portfolio.totalOpenViolations}</strong> open violations in total.</>
          )}
        </PlainLanguage>
      </ExpandableIndicator>

      <ExpandableIndicator
        value={c.complaints12mo}
        label="311 complaints"
        sub={c.topComplaintType ?? "No complaints on record"}
        severity={c.complaints12mo > 0 ? "watch" : "good"}
      >
        <div className="mb-2 flex items-start gap-3">
          <Phone className="mt-0.5 h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {c.topComplaintType ? <>Most reported: {c.topComplaintType}</> : <>No 311 calls on record for this address.</>}
          </p>
        </div>
        {data.recent311.length > 0 && (
          <ul className="space-y-2">
            {data.recent311.map((cc, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{cc.type}</span>
                <span className="text-xs text-muted-foreground">{cc.date}</span>
              </li>
            ))}
          </ul>
        )}
        <PlainLanguage>
          {data.portfolio ? (
            <>Across all <strong>{data.portfolio.propertiesInHartford}</strong> Hartford properties owned by {ownerLabel}, residents and neighbors have filed <strong>{data.portfolio.totalComplaints12mo}</strong> 311 complaints in the last 12 months.</>
          ) : (
            <>311 is the city's non-emergency line for issues like trash, rats, broken streetlights, and parking.</>
          )}
        </PlainLanguage>
      </ExpandableIndicator>
    </div>
  );
}

function ShareSlideshow({ data }: { data: Found }) {
  const slides = [
    { eyebrow: "Wake Up Wednesday", title: data.address.display, body: "Hartford, CT" },
    { eyebrow: "Code violations", title: `${data.counts.violationsOpen} code violations open`, body: "From city housing inspectors." },
    { eyebrow: "311 complaints", title: `${data.counts.complaints12mo} complaints to 311 in the last 12 months`, body: data.counts.topComplaintType ? `Top issue: ${data.counts.topComplaintType}` : "No top category on record." },
  ];
  const [i, setI] = useState(0);
  const slide = slides[i];

  const [shareStatus, setShareStatus] = useState<null | "copied" | "error">(null);
  const handleShare = async () => {
    const text = `${data.address.display} — ${data.counts.violationsOpen} open code violations, ${data.counts.complaints12mo} 311 complaints in the last year. See more on Wake Up Wednesday.`;
    const result = await shareOrCopy({ title: "Wake Up Wednesday", text });
    if (result) {
      setShareStatus(result);
      setTimeout(() => setShareStatus(null), 2500);
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
          <div className="flex flex-1 flex-col justify-center min-h-0 overflow-hidden">
            <p className="font-display text-3xl leading-tight break-words sm:text-4xl">{slide.title}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-90 break-words sm:text-base">{slide.body}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider opacity-60">naacp greater hartford · wake up wednesday</p>
        </div>
      </div>



      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
        >
          <Play className="h-3.5 w-3.5 rotate-180" /> Prev
        </button>
        <button
          onClick={() => setI((x) => (x + 1) % slides.length)}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
        >
          <Play className="h-3.5 w-3.5" /> Next
        </button>
      </div>

      {(() => {
        const text = `${data.address.display} — ${data.counts.violationsOpen} open code violations, ${data.counts.complaints12mo} 311 complaints in the last year. See more on Wake Up Wednesday.`;
        const url = typeof window !== "undefined" ? window.location.href : "";
        const payload = `${text}\n${url}`;
        const sms = `sms:?&body=${encodeURIComponent(payload)}`;
        const mailto = `mailto:?subject=${encodeURIComponent("Wake Up Wednesday — " + data.address.display)}&body=${encodeURIComponent(payload)}`;
        return (
          <div className="grid grid-cols-2 gap-2">
            <a href={sms} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-90">
              <MessageSquare className="h-4 w-4" />
              Text this
            </a>
            <a href={mailto} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-90">
              <Mail className="h-4 w-4" />
              Email this
            </a>
          </div>
        );
      })()}

      <Button onClick={handleShare} variant="outline" className="w-full" size="lg">
        <Share2 className="h-4 w-4" />
        {shareStatus === "copied" ? "Copied to clipboard!" : shareStatus === "error" ? "Couldn't copy — try selecting manually" : "More share options"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Auto-generated cards you can post to Instagram, Facebook, or send to a neighbor.
      </p>
    </div>
  );
}

function PrintReport({ data }: { data: Found }) {
  const c = data.counts;
  const owner = data.address.owner ?? "Not on record";

  const handlePrint = async () => {
    const shareUrl = `${window.location.origin}/home?address=${encodeURIComponent(data.address.display)}`;
    let qrDataUrl = "";
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240, color: { dark: "#14213d", light: "#ffffff" } });
    } catch {}
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wake Up Wednesday — ${escapeHtml(data.address.display)}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #14213d; margin: 0; line-height: 1.45; }
  .eyebrow { font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8860b; margin: 0 0 6px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 18px 0 8px; border-bottom: 1px solid #d6cfc1; padding-bottom: 4px; }
  .sub { font-family: Arial, sans-serif; font-size: 12px; color: #555; margin: 0 0 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
  .card { border: 1px solid #d6cfc1; border-radius: 8px; padding: 10px 12px; }
  .card .label { font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
  .card .num { font-size: 28px; font-weight: bold; margin: 4px 0 2px; }
  .card .note { font-family: Arial, sans-serif; font-size: 11px; color: #555; }
  .pill { display: inline-block; font-family: Arial, sans-serif; font-size: 9px; padding: 2px 7px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold; }
  .good { background:#e6f4ea; color:#1e6b3a; } .watch{ background:#fff4d6; color:#7a5a00; } .concern{ background:#fde2e1; color:#a11d1d; }
  table { width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; margin-top: 6px; }
  th, td { text-align:left; padding: 6px 4px; border-bottom: 1px solid #ece7da; }
  th { color:#555; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  .meta { font-family: Arial, sans-serif; font-size: 11px; color:#555; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #d6cfc1; font-family: Arial, sans-serif; font-size: 10px; color:#555; display:flex; justify-content:space-between; }
  .plain { background:#f5efe2; border-radius:6px; padding:8px 10px; font-family: Arial, sans-serif; font-size: 11px; margin-top: 8px; }
  .header { display:flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
  .header .titles { flex: 1; min-width: 0; }
  .qr { text-align:center; font-family: Arial, sans-serif; font-size: 9px; color:#555; line-height:1.3; }
  .qr img { display:block; width: 96px; height: 96px; }
  .qr .label { margin-top: 4px; max-width: 96px; word-break: break-all; }
</style></head><body>
  <div class="header">
    <div class="titles">
      <p class="eyebrow">Wake Up Wednesday · Greater Hartford Branch NAACP</p>
      <h1>${escapeHtml(data.address.display)}</h1>
      <p class="sub">Hartford, CT · Owner: ${escapeHtml(owner)} · Year built and unit count not available</p>
    </div>
    ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code to view this report online"><div>Scan to view<br>or share</div></div>` : ""}
  </div>

  <h2>Report Card</h2>
  <div class="grid">
    <div class="card"><span class="pill ${c.violationsOpen > 2 ? "concern" : c.violationsOpen > 0 ? "watch" : "good"}">Code violations</span><div class="num">${c.violationsOpen}</div><div class="note">${c.violationsClosed12mo} closed in last year</div></div>
    <div class="card"><span class="pill ${c.complaints12mo > 0 ? "watch" : "good"}">311 complaints</span><div class="num">${c.complaints12mo}</div><div class="note">${escapeHtml(c.topComplaintType ?? "no top category")}</div></div>
  </div>

  <h2>Code violations</h2>
  <p class="meta">From Hartford Housing Code Enforcement. ${c.violationsOpen} open, ${c.violationsClosed12mo} closed in the last year.</p>
  ${data.recentViolations.length === 0
    ? `<p class="meta">No recent violations on record.</p>`
    : `<table><thead><tr><th>Date</th><th>Description</th><th>Status</th></tr></thead><tbody>
        ${data.recentViolations.map(v => `<tr><td>${escapeHtml(v.date)}</td><td>${escapeHtml(v.description)}</td><td>${escapeHtml(v.status)}</td></tr>`).join("")}
      </tbody></table>`}
  <div class="plain">Open violations mean the city has asked your landlord to fix something. Call <strong>311</strong> if a problem hasn't been fixed.</div>

  <h2>311 complaints</h2>
  <p class="meta">${c.topComplaintType ? `Most reported: ${escapeHtml(c.topComplaintType)} · ` : ""}${c.complaints12mo} total in last 12 months.</p>
  ${data.recent311.length === 0
    ? `<p class="meta">No recent 311 calls on record.</p>`
    : `<table><thead><tr><th>Date</th><th>Type</th></tr></thead><tbody>
        ${data.recent311.map(cc => `<tr><td>${escapeHtml(cc.date)}</td><td>${escapeHtml(cc.type)}</td></tr>`).join("")}
      </tbody></table>`}

  <footer><span>${escapeHtml(shareUrl)}</span><span>Generated ${new Date().toLocaleDateString()}</span></footer>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow pop-ups to print this report."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <Printer className="mt-0.5 h-5 w-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-display text-xl leading-tight">Printable PDF report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A one-page summary with the report card on top and details below — perfect for handing to a neighbor, landlord, or city council member.
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} className="mt-4 w-full" size="lg">
          <Printer className="h-4 w-4" /> Open print preview
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          In the print dialog, choose <strong>Save as PDF</strong> to download a copy.
        </p>
      </Card>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
        <h3 className="mt-2 font-display text-lg">{data.address.display}</h3>
        <p className="text-xs text-muted-foreground">Hartford, CT · Owner: {owner}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">Code violations</div><div className="font-display text-2xl">{c.violationsOpen}</div></div>
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">311 complaints</div><div className="font-display text-2xl">{c.complaints12mo}</div></div>
        </div>
      </div>
    </div>
  );
}

function LandlordCard({ data }: { data: Found }) {
  const owner = data.address.owner;
  const p = data.portfolio;
  const NA = <span className="text-muted-foreground/70 italic">Not available</span>;
  return (
    <Card className="mb-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Owner / Landlord</p>
          <h2 className="font-display text-lg leading-tight">{owner ?? "Not on record"}</h2>

          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{NA}</p>
            <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{NA}</p>
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />{NA}</p>
          </div>

          {p && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> This owner's full Hartford portfolio
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <PortfolioStat value={p.propertiesInHartford} label="properties" />
                <PortfolioStat value={p.totalOpenViolations} label="open code violations" />
                <PortfolioStat value={p.totalComplaints12mo} label="311 complaints, last yr" />
                <PortfolioStatNA label="total units" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Rollup based on owner-name match across Hartford code enforcement records.</p>
            </div>
          )}

          <Link
            to="/landlord-letter"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[14px] font-semibold text-gold-foreground shadow-soft transition active:scale-[0.99]"
          >
            <Mail className="h-4 w-4" />
            Write a Letter of Complaint to your Landlord
          </Link>
        </div>
      </div>
    </Card>
  );
}

function PortfolioStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md bg-card px-2.5 py-2">
      <div className="font-display text-xl leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function PortfolioStatNA({ label }: { label: string }) {
  return (
    <div className="rounded-md bg-card px-2.5 py-2">
      <div className="text-[11px] italic text-muted-foreground/70">Not available</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
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
          <Link to="/home-actions" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition active:scale-[0.99]">
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
