import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, TrendingUp, DollarSign, Home as HomeIcon, Printer, Share2, Play, MapPin, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { geocodeAddressToTract, getTractIndicators, type Indicator } from "@/lib/tract-indicators.functions";

export const Route = createFileRoute("/neighborhood")({
  head: () => ({
    meta: [
      { title: "Your Neighborhood — Wake Up Wednesday" },
      { name: "description", content: "Live census-tract indicators and a plain-language report card for your neighborhood." },
    ],
  }),
  component: NeighborhoodPage,
});

type Tract = { address: string; state: string; county: string; tract: string; tractName: string; neighborhood?: string };

// Default to Upper Albany, Hartford (tract 5024.00)
const DEFAULT_TRACT: Tract = {
  address: "247 Garden St, Hartford, CT 06112",
  state: "09",
  county: "003",
  tract: "502400",
  tractName: "5024.00",
  neighborhood: "Upper Albany, Hartford",
};

function NeighborhoodPage() {
  const { save } = useStoredAddress();
  const [tract, setTract] = useState<Tract>(DEFAULT_TRACT);
  const [showLookup, setShowLookup] = useState(false);

  const fetchIndicators = useServerFn(getTractIndicators);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tract-indicators", tract.state, tract.county, tract.tract],
    queryFn: () => fetchIndicators({ data: { state: tract.state, county: tract.county, tract: tract.tract } }),
    staleTime: 1000 * 60 * 60,
  });

  const handleResolved = (t: Tract) => {
    setTract(t);
    save(t.address);
    setShowLookup(false);
  };

  const indicators = data?.indicators ?? [];
  const byKey = (k: string) => indicators.find((i) => i.key === k);

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Start
        </Link>
        <button
          type="button"
          onClick={() => setShowLookup((v) => !v)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" /> Look Up Additional Address
        </button>
      </div>

      {showLookup && <CensusTractLookup onResolved={handleResolved} />}

      <SectionHeader
        eyebrow={`Census Tract ${tract.tractName}`}
        title={tract.neighborhood ?? "Your neighborhood"}
        subtitle="Live indicators for this tract, from the Census Bureau and USDA."
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-2.5">
        <Stat icon={DollarSign} label="Median income" value={byKey("median_income")?.value ?? "—"} loading={isLoading} />
        <Stat icon={HomeIcon} label="Renter share" value={byKey("renter_share")?.value ?? "—"} loading={isLoading} />
        <Stat icon={TrendingUp} label="Unemployment" value={byKey("unemployment")?.value ?? "—"} small loading={isLoading} />
      </div>

      {data?.error && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive">{data.error}</p>
        </Card>
      )}

      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto bg-secondary/60 p-1">
          <TabsTrigger value="card" className="py-1.5 text-[11px] font-semibold">Report Card</TabsTrigger>
          <TabsTrigger value="story" className="py-1.5 text-[11px] font-semibold">Detailed</TabsTrigger>
          <TabsTrigger value="share" className="py-1.5 text-[11px] font-semibold">Share</TabsTrigger>
          <TabsTrigger value="print" className="py-1.5 text-[11px] font-semibold">Print</TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="mt-4">
          <NeighborhoodReportCard indicators={indicators} loading={isLoading} error={isError} />
        </TabsContent>
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
    </AppShell>
  );
}

function severityLabel(s: Indicator["severity"]) {
  return s === "good" ? "OK" : s === "watch" ? "Watch" : s === "concern" ? "Concern" : null;
}

function IndicatorRow({ ind }: { ind: Indicator }) {
  const label = severityLabel(ind.severity);
  return (
    <li className="flex items-start justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl leading-none text-card-foreground">{ind.value}</span>
          <p className="font-medium text-card-foreground">{ind.label}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{ind.note}</p>
      </div>
      {label && <SeverityPill severity={ind.severity as "good" | "watch" | "concern"}>{label}</SeverityPill>}
    </li>
  );
}

function NeighborhoodReportCard({ indicators, loading, error }: { indicators: Indicator[]; loading: boolean; error: boolean }) {
  return (
    <Card className="mb-4">
      <h2 className="mb-1 font-display text-xl text-card-foreground">Neighborhood report card</h2>
      <p className="mb-4 text-sm text-muted-foreground">Ten indicators that shape daily life in this census tract.</p>
      {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading live Census data…</p>}
      {error && !loading && <p className="py-6 text-center text-sm text-destructive">Couldn't load indicators.</p>}
      {!loading && !error && (
        <ul className="divide-y divide-border">
          {indicators.map((ind) => <IndicatorRow key={ind.key} ind={ind} />)}
        </ul>
      )}
    </Card>
  );
}

function NeighborhoodDetailed({ indicators, loading }: { indicators: Indicator[]; loading: boolean }) {
  if (loading) return <Card><p className="py-4 text-sm text-muted-foreground">Loading…</p></Card>;
  return (
    <div className="space-y-4">
      {indicators.map((ind) => {
        const label = severityLabel(ind.severity);
        return (
          <Card key={ind.key}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="font-display text-2xl leading-none text-card-foreground">{ind.value}</span>
                <div>
                  <h3 className="font-display text-lg leading-tight text-card-foreground">{ind.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{ind.note}</p>
                </div>
              </div>
              {label && <SeverityPill severity={ind.severity as "good" | "watch" | "concern"}>{label}</SeverityPill>}
            </div>
          </Card>
        );
      })}
      <Card>
        <h3 className="mb-2 font-display text-lg text-card-foreground">Where this comes from</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All numbers are pulled live from the US Census Bureau's American Community Survey (ACS 5-year, 2022)
          and the USDA Food Access Research Atlas. "Watch" or "Concern" doesn't mean a neighborhood is bad —
          it flags something worth knowing about and talking through on Wake Up Wednesday.
        </p>
      </Card>
    </div>
  );
}

function NeighborhoodShare({ tract, indicators }: { tract: Tract; indicators: Indicator[] }) {
  const slides = [
    { eyebrow: "Wake Up Wednesday", title: tract.neighborhood ?? tract.tractName, body: `Census Tract ${tract.tractName}` },
    ...indicators.slice(0, 4).map((ind) => ({
      eyebrow: ind.label,
      title: ind.value,
      body: ind.note,
    })),
  ];
  const [i, setI] = useState(0);
  const slide = slides[i] ?? slides[0];
  const [shareStatus, setShareStatus] = useState<null | "copied" | "error">(null);

  const handleShare = async () => {
    const concerns = indicators.filter((c) => c.severity === "concern").map((c) => c.label).join(", ");
    const text = `${tract.neighborhood ?? tract.tractName} — ${concerns ? `concerns: ${concerns}.` : "neighborhood report card."} See more on Wake Up Wednesday.`;
    const url = window.location.href;
    const payload = `${text}\n${url}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Wake Up Wednesday", text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
    setTimeout(() => setShareStatus(null), 2500);
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

      <Button onClick={handleShare} className="w-full" size="lg">
        <Share2 className="h-4 w-4" />
        {shareStatus === "copied" ? "Copied to clipboard!" : shareStatus === "error" ? "Couldn't copy — try selecting manually" : "Share to social or text"}
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
      <p class="eyebrow">Wake Up Wednesday · NAACP Greater Hartford</p>
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
    Source: US Census Bureau, American Community Survey 5-year (2022); USDA Food Access Research Atlas (2019).
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
  const lookupAddress = useServerFn(geocodeAddressToTract);

  const canSubmit = street.trim().length > 2 && city.trim().length > 1 && state.trim().length >= 2;

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
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg leading-tight text-card-foreground">Find your census tract</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Enter a real US street address (no PO boxes, intersections, or place names).
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col gap-2">
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Street address (e.g. 1234 Main St)"
            autoComplete="address-line1"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.slice(0, 2))}
              placeholder="ST"
              maxLength={2}
              autoComplete="address-level1"
              className="w-16 rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] uppercase text-card-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          Address lookup via the US Census Bureau Geocoder. Indicators from ACS 5-year (2022) + USDA Food Access Atlas (2019).
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
