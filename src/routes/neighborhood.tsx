import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, TrendingUp, DollarSign, Home as HomeIcon, Printer, Share2, Play, MapPin, Search, Loader2, Megaphone, ArrowRight, ShieldCheck, AlertTriangle, AlertOctagon, Minus, Mail, MessageSquare } from "lucide-react";

type SeverityIconProps = { severity: Indicator["severity"] | null; className?: string };
function SeverityIcon({ severity, className = "h-5 w-5" }: SeverityIconProps) {
  if (severity === "good") return <ShieldCheck className={className} aria-label="On par or better than CT" />;
  if (severity === "watch") return <AlertTriangle className={className} aria-label="Worth watching" />;
  if (severity === "concern") return <AlertOctagon className={className} aria-label="Concern" />;
  return <Minus className={className} aria-label="Neutral" />;
}
import { lazy, Suspense, useEffect, useState } from "react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { geocodeAddressToTract, getTractIndicators, type Indicator } from "@/lib/tract-indicators.functions";
import { suggestHartfordAddresses } from "@/lib/address-lookup.functions";
import { TractStoryDialog } from "@/components/TractStoryDialog";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/track-event";

const TargetTractMap = lazy(() => import("@/components/TargetTractMap"));

export const Route = createFileRoute("/neighborhood")({
  head: () => ({
    meta: [
      { title: "Your Neighborhood — Wake Up Wednesday" },
      { name: "description", content: "Live census-tract indicators and a plain-language report card for your neighborhood." },
      { property: "og:title", content: "Your Neighborhood — Wake Up Wednesday" },
      { property: "og:description", content: "Live census-tract indicators and a plain-language report card for your neighborhood." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/neighborhood" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/neighborhood" },
    ],
  }),
  component: NeighborhoodPage,
});

type Tract = { address: string; state: string; county: string; tract: string; tractName: string; neighborhood?: string };

function NeighborhoodPage() {
  const { save } = useStoredAddress();
  const [tract, setTract] = useState<Tract | null>(null);

  const fetchIndicators = useServerFn(getTractIndicators);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["tract-indicators", tract?.state, tract?.county, tract?.tract],
    queryFn: () => fetchIndicators({ data: { state: tract!.state, county: tract!.county, tract: tract!.tract } }),
    staleTime: 1000 * 60 * 60,
    enabled: !!tract,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const handleResolved = (t: Tract) => {
    setTract(t);
    save(t.address);
  };

  const indicators = data?.indicators ?? [];
  const byKey = (k: string) => indicators.find((i) => i.key === k);

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        {tract && (
          <button
            type="button"
            onClick={() => setTract(null)}
            className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-4 w-4 shrink-0" /> Choose another neighborhood
          </button>
        )}
      </div>

      {!tract && (
        <>
          <SectionHeader
            title="Learn About Your Neighborhood"
            subtitle="Enter an address or tap a tract on the map. Highlighted tracts are Greater Hartford NAACP's primary focus. FYI: You can look up any address in USA."
          />
          <div id="neighborhood-lookup">
            <Card className="mb-5">
              <Tabs defaultValue="address">
                <TabsList className="grid w-full grid-cols-2 h-auto bg-secondary/60 p-1">
                  <TabsTrigger value="address" className="py-1.5 text-[12px] font-semibold text-foreground data-[state=active]:text-primary">Enter Address</TabsTrigger>
                  <TabsTrigger value="map" className="py-1.5 text-[12px] font-semibold text-foreground data-[state=active]:text-primary">Click from Map</TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="mt-3">
                  <Suspense fallback={<div className="flex h-[320px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">Loading map…</div>}>
                    <TargetTractMap selectedTract={null} onSelect={(t) => { trackEvent("neighborhood_map_tract_click", { tract: t.tract }); handleResolved(t); }} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="address" className="mt-3">
                  <CensusTractLookup onResolved={(t) => { trackEvent("neighborhood_address_submit", { tract: t.tract }); handleResolved(t); }} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

        </>
      )}


      {tract && (
        <>
          <SectionHeader
            eyebrow={`Census Tract ${tract.tractName}`}
            title={tract.neighborhood ?? "Your neighborhood"}
            subtitle="Live indicators for this tract, from the Census Bureau and USDA."
          />

          {indicators.length > 0 && (
            <TractStoryDialog
              tractName={tract.tractName}
              neighborhood={tract.neighborhood ?? `Tract ${tract.tractName}`}
              indicators={indicators}
              stateFips={tract.state}
            />

          )}

          {data?.error && (
            <Card className="mb-4 border-destructive/30 bg-destructive/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">{data.error}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="shrink-0"
                >
                  {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isFetching ? "Retrying…" : "Retry"}
                </Button>
              </div>
            </Card>
          )}

          <Tabs defaultValue="story" className="w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 ways to view Neighborhood data</p>
            <TabsList className="grid w-full grid-cols-3 h-auto bg-secondary/60 p-1">
              <TabsTrigger value="story" className="py-1.5 text-[11px] font-semibold">Report Card</TabsTrigger>
              <TabsTrigger value="share" className="py-1.5 text-[11px] font-semibold">Share</TabsTrigger>
              <TabsTrigger value="print" className="py-1.5 text-[11px] font-semibold">Print</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-4">
              <NeighborhoodDetailed indicators={indicators} loading={isLoading} />
            </TabsContent>
            <TabsContent value="share" className="mt-4">
              <NeighborhoodShare tract={tract} indicators={indicators} />
            </TabsContent>
            <TabsContent value="print" className="mt-4">
              <NeighborhoodPrint tract={tract} indicators={indicators} />
            </TabsContent>
          </Tabs>

          <TakeAction tract={tract} />
        </>

      )}
    </AppShell>
  );
}






function cardStyle(s: Indicator["severity"]): { className: string; style?: React.CSSProperties } {
  if (s === "good") return { className: "bg-success border-success text-success-foreground" };
  if (s === "watch") return { className: "bg-warning border-warning text-warning-foreground" };
  if (s === "concern") return {
    className: "border-transparent text-white",
    style: { backgroundColor: "oklch(0.5 0.24 27)" },
  };
  return {
    className: "border-transparent text-white",
    style: { backgroundColor: "oklch(0.5 0.02 280)" },
  };
}

function SeverityLegend() {
  const items = [
    { dot: "bg-success", label: "Green", desc: "On par with or better than CT average" },
    { dot: "bg-warning", label: "Yellow", desc: "Worth watching — notably off the CT average" },
    { dot: "bg-destructive", label: "Red", desc: "Concern — significantly worse than CT average" },
    { dot: "bg-muted-foreground/60", label: "Gray", desc: "No comparison available" },
  ];
  return (
    <Card className="bg-card/95">
      <h3 className="mb-2 font-display text-base text-card-foreground">What the colors mean</h3>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2 text-xs">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${i.dot}`} />
            <span className="text-card-foreground"><strong>{i.label}:</strong> <span className="text-muted-foreground">{i.desc}</span></span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NeighborhoodDetailed({ indicators, loading }: { indicators: Indicator[]; loading: boolean }) {
  if (loading) return <Card><p className="py-4 text-sm text-muted-foreground">Loading…</p></Card>;
  return (
    <div className="space-y-4">
      <SeverityLegend />
      {indicators.map((ind) => {
        const cs = cardStyle(ind.severity);
        return (
        <div key={ind.key} className={`rounded-lg border p-4 shadow-sm ${cs.className}`} style={cs.style}>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              {ind.key !== "population" && (
                <SeverityIcon severity={ind.severity} className="h-5 w-5 self-center shrink-0" />
              )}
              <span className="font-display text-2xl leading-none">{ind.value}</span>
              <h3 className="font-display text-lg leading-tight">{ind.label}</h3>
            </div>
            <p className="mt-1 text-sm opacity-90">{ind.note}</p>
            {ind.stateAverage && (
              <p className="mt-2 text-xs font-semibold">{ind.stateAverage.label}</p>
            )}
          </div>
        </div>
        );
      })}
      <Card>
        <h3 className="mb-2 font-display text-lg text-card-foreground">Where this comes from</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All numbers are pulled live from the US Census Bureau's American Community Survey (ACS 5-year, 2022). Comparisons are against the Connecticut statewide ACS figure.
          "Watch" or "Concern" doesn't mean a neighborhood is bad — it flags something worth knowing about and
          talking through on Wake Up Wednesday.
        </p>
      </Card>
    </div>
  );
}

function slideBg(s: Indicator["severity"] | null): React.CSSProperties {
  if (s === "good") return { background: "linear-gradient(135deg, oklch(0.45 0.13 155), oklch(0.38 0.11 155))" };
  if (s === "watch") return { background: "linear-gradient(135deg, oklch(0.55 0.14 70), oklch(0.45 0.12 65))" };
  if (s === "concern") return { background: "linear-gradient(135deg, oklch(0.45 0.18 27), oklch(0.38 0.16 25))" };
  return {};
}

function NeighborhoodShare({ tract, indicators }: { tract: Tract; indicators: Indicator[] }) {
  const slides = [
    { eyebrow: "Coming soon", title: "[[this slide show to be replaced by videos of neighborhoods]]", body: "", compare: null as string | null, severity: null as Indicator["severity"] | null },
    { eyebrow: "Wake Up Wednesday", title: `See the story of ${tract.neighborhood ?? tract.tractName}, told in data.`, body: `Census Tract ${tract.tractName}`, compare: null as string | null, severity: null as Indicator["severity"] | null },
    ...indicators.map((ind) => ({
      eyebrow: ind.label,
      title: ind.value,
      body: ind.note,
      compare: ind.stateAverage?.label ?? null,
      severity: ind.key === "population" ? null : ind.severity,
    })),
  ];
  const [i, setI] = useState(0);
  const slide = slides[i] ?? slides[0];
  const [shareStatus, setShareStatus] = useState<null | "copied" | "error">(null);

  const handleShare = async () => {
    const concerns = indicators.filter((c) => c.severity === "concern").map((c) => c.label).join(", ");
    const text = `${tract.neighborhood ?? tract.tractName} — ${concerns ? `concerns: ${concerns}.` : "neighborhood report card."} See more on Wake Up Wednesday.`;
    const result = await shareOrCopy({ title: "Wake Up Wednesday", text });
    if (result) {
      setShareStatus(result);
      setTimeout(() => setShareStatus(null), 2500);
    }
  };

  const tintStyle = slideBg(slide.severity);
  const hasTint = Boolean(slide.severity);

  return (
    <div className="space-y-3">
      <div
        className={`aspect-square overflow-hidden rounded-2xl p-6 shadow-soft ${hasTint ? "text-primary-foreground" : "bg-gradient-to-br from-gray-700 to-gray-800 text-white"}`}
        style={tintStyle}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-70">
            <span>{slide.eyebrow}</span>
            <span>{i + 1} / {slides.length}</span>
          </div>
          <div className="flex flex-1 flex-col justify-center min-h-0 overflow-hidden">
            {slide.severity && (
              <SeverityIcon severity={slide.severity} className="mb-2 h-8 w-8 opacity-90" />
            )}
            <p className="font-display text-3xl leading-tight break-words sm:text-4xl">{slide.title}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-90 break-words sm:text-base">{slide.body}</p>
            {slide.compare && (
              <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold leading-snug break-words sm:text-sm">
                {slide.severity && <SeverityIcon severity={slide.severity} className="h-3.5 w-3.5 shrink-0" />}
                <span className="break-words">{slide.compare}</span>
              </p>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider opacity-60">naacp greater hartford · wake up wednesday</p>
        </div>
      </div>



      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Play className="h-3.5 w-3.5 rotate-180" /> Prev
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setI((x) => (x + 1) % slides.length)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Play className="h-3.5 w-3.5" /> Next
        </button>
      </div>

      {(() => {
        const concerns = indicators.filter((c) => c.severity === "concern").map((c) => c.label).join(", ");
        const text = `${tract.neighborhood ?? tract.tractName} — ${concerns ? `concerns: ${concerns}.` : "neighborhood report card."} See more on Wake Up Wednesday.`;
        const url = typeof window !== "undefined" ? window.location.href : "";
        const payload = `${text}\n${url}`;
        const sms = `sms:?&body=${encodeURIComponent(payload)}`;
        const mailto = `mailto:?subject=${encodeURIComponent("Wake Up Wednesday — " + (tract.neighborhood ?? tract.tractName))}&body=${encodeURIComponent(payload)}`;
        return (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={sms}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-90"
            >
              <MessageSquare className="h-4 w-4" />
              Text this
            </a>
            <a
              href={mailto}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-90"
            >
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

function NeighborhoodPrint({ tract, indicators }: { tract: Tract; indicators: Indicator[] }) {
  const handlePrint = async () => {
    const shareUrl = `${window.location.origin}/neighborhood`;
    let qrDataUrl = "";
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240, color: { dark: "#14213d", light: "#ffffff" } });
    } catch {}
    const rows = indicators
      .map(
        (ind) =>
          `<tr><td><strong>${escapeHtml(ind.value)}</strong></td><td>${escapeHtml(ind.label)}</td><td>${escapeHtml(ind.note)}</td><td><span class="pill ${ind.severity}">${ind.severity}</span></td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wake Up Wednesday — ${escapeHtml(tract.neighborhood ?? tract.tractName)}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #14213d; margin: 0; line-height: 1.45; }
  .eyebrow { font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8860b; margin: 0 0 6px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 18px 0 8px; border-bottom: 1px solid #d6cfc1; padding-bottom: 4px; }
  .sub { font-family: Arial, sans-serif; font-size: 12px; color: #555; margin: 0 0 14px; }
  .pill { display: inline-block; font-family: Arial, sans-serif; font-size: 9px; padding: 2px 7px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold; }
  .good { background:#e6f4ea; color:#1e6b3a; } .watch{ background:#fff4d6; color:#7a5a00; } .concern{ background:#fde2e1; color:#a11d1d; } .neutral{ background:#eee; color:#444; }
  table { width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; margin-top: 6px; }
  th, td { text-align:left; padding: 8px 6px; border-bottom: 1px solid #ece7da; vertical-align: top; }
  th { color:#555; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #d6cfc1; font-family: Arial, sans-serif; font-size: 10px; color:#555; display:flex; justify-content:space-between; }
  .header { display:flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
  .header .titles { flex: 1; min-width: 0; }
  .qr { text-align:center; font-family: Arial, sans-serif; font-size: 9px; color:#555; line-height:1.3; }
  .qr img { display:block; width: 96px; height: 96px; }
</style></head><body>
  <div class="header">
    <div class="titles">
      <p class="eyebrow">Wake Up Wednesday · Greater Hartford Branch NAACP</p>
      <h1>${escapeHtml(tract.neighborhood ?? tract.tractName)}</h1>
      <p class="sub">Census Tract ${escapeHtml(tract.tractName)} · ${escapeHtml(tract.address)}</p>
    </div>
    ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code"><div>Scan to view<br>or share</div></div>` : ""}
  </div>

  <h2>Indicators</h2>
  <table><thead><tr><th>Value</th><th>Indicator</th><th>What it means</th><th>Status</th></tr></thead><tbody>
    ${rows}
  </tbody></table>

  <p style="font-family: Arial, sans-serif; font-size: 10px; color:#555; margin-top: 10px;">
    Source: US Census Bureau, American Community Survey 5-year (2022).
  </p>

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
            <h2 className="font-display text-xl leading-tight text-card-foreground">Printable PDF report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A one-page neighborhood summary — perfect for handing to a neighbor, council member, or community meeting.
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} className="mt-4 w-full" size="lg" disabled={indicators.length === 0}>
          <Printer className="h-4 w-4" /> Open print preview
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          In the print dialog, choose <strong>Save as PDF</strong> to download a copy.
        </p>
      </Card>

      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
        <h3 className="mt-2 font-display text-lg text-card-foreground">{tract.neighborhood ?? tract.tractName}</h3>
        <p className="text-xs text-muted-foreground">Census Tract {tract.tractName}</p>
        <ul className="mt-3 space-y-1.5 text-xs">
          {indicators.map((ind) => (
            <li key={ind.key} className="flex items-center justify-between gap-2 text-card-foreground">
              <span><strong>{ind.value}</strong> · {ind.label}</span>
              <span className="text-muted-foreground capitalize">{ind.severity}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function CensusTractLookup({ onResolved }: { onResolved: (t: Tract) => void }) {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Tract | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const lookupAddress = useServerFn(geocodeAddressToTract);
  const suggest = useServerFn(suggestHartfordAddresses);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(street), 180);
    return () => clearTimeout(t);
  }, [street]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["neighborhood-address-suggest", debounced],
    queryFn: () => suggest({ data: { query: debounced } }),
    enabled: suggestOpen && debounced.trim().length >= 2,
    staleTime: 30_000,
  });

  const canSubmit = street.trim().length > 2 && city.trim().length > 1 && state.trim().length >= 2;

  const pickSuggestion = async (s: { display: string; normalized: string }) => {
    setStreet(s.display);
    setCity((c) => c || "Hartford");
    setState((st) => st || "CT");
    setSuggestOpen(false);
    const q = `${s.display}, Hartford, CT`;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resolved = await lookupAddress({ data: { address: q } });
      if (resolved.error) {
        setError(resolved.error);
        return;
      }
      setResult(resolved);
      onResolved(resolved);
    } catch {
      setError("Couldn't reach the Census geocoder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const q = `${street.trim()}, ${city.trim()}, ${state.trim().toUpperCase()}`;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resolved = await lookupAddress({ data: { address: q } });
      if (resolved.error) {
        setError(resolved.error);
        return;
      }
      setResult(resolved);
      onResolved(resolved);
    } catch {
      setError("Couldn't reach the Census geocoder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="census-lookup">
      <Card className="mb-5">
        <p className="mb-3 text-[12px] text-muted-foreground">
          Enter a real US street address (no PO boxes, intersections, or place names).
        </p>

        <form onSubmit={handleLookup} className="flex flex-col gap-2">
          <label htmlFor="lookup-street" className="sr-only">Street address</label>
          <div className="relative">
            <input
              id="lookup-street"
              type="text"
              value={street}
              onChange={(e) => { setStreet(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              placeholder="Street address (e.g. 1234 Main St)"
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestOpen && suggestions.length > 0}
              aria-autocomplete="list"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
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
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-foreground hover:bg-secondary/60"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{s.display}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2">
            <label htmlFor="lookup-city" className="sr-only">City</label>
            <input
              id="lookup-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <label htmlFor="lookup-state" className="sr-only">State</label>
            <input
              id="lookup-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.slice(0, 2))}
              placeholder="ST"
              maxLength={2}
              autoComplete="address-level1"
              className="w-14 shrink-0 rounded-lg border border-border bg-card px-2 py-2.5 text-center text-[14px] uppercase text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button type="submit" disabled={loading || !canSubmit} size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Looking up…" : "Look up"}
          </Button>
        </form>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
        )}

        {result && (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Census tract</p>
            <p className="mt-1 font-display text-xl text-card-foreground">{result.tractName}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{result.address}</p>
          </div>
        )}

        <p className="mt-3 text-[10px] text-muted-foreground">
          Address lookup via the US Census Bureau Geocoder.
        </p>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, small, loading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; small?: boolean; loading?: boolean }) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-2.5 sm:p-3"
      style={{
        ["--foreground" as string]: "var(--card-foreground)",
        ["--muted-foreground" as string]: "oklch(0.45 0.04 290)",
        ["--border" as string]: "oklch(0.85 0.02 80)",
      }}
    >
      <Icon className="mb-1 h-3.5 w-3.5 text-gold sm:mb-1.5 sm:h-4 sm:w-4" />
      <p className={`font-display leading-tight text-card-foreground ${small ? "text-base" : "text-lg"} sm:${small ? "text-lg" : "text-xl"}`}>
        {loading ? "…" : value}
      </p>
      <p className="text-[10px] text-muted-foreground sm:text-[11px]">{label}</p>
    </div>
  );
}

function TakeAction({ tract }: { tract: Tract }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl leading-tight">Ready to do something?</h3>
          <p className="mt-1 text-sm text-foreground/80">
            Find help, email your rep, or share this report — tailored to what this tract needs most.
          </p>
          <Link
            to="/neighborhood-actions"
            search={{
              state: tract.state,
              county: tract.county,
              tract: tract.tract,
              name: tract.tractName,
              neighborhood: tract.neighborhood ?? "",
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            Take action
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
