import { createFileRoute, Link } from "@tanstack/react-router";

import { AlertTriangle, FileWarning, Zap, Phone, ChevronLeft, Search, MapPin, Play, Share2, ArrowRight, Megaphone, Printer, Building2, Mail, Briefcase } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BuildingStoryDialog } from "@/components/BuildingStoryDialog";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

const PickAddressMap = lazy(() =>
  import("@/components/BuildingAddressMap").then((m) => ({ default: m.PickAddressMap })),
);
const AddressLocationMap = lazy(() =>
  import("@/components/BuildingAddressMap").then((m) => ({ default: m.AddressLocationMap })),
);

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
  const { address, save, clear } = useStoredAddress();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

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
    if (!v) return;
    setActive(v);
    save(v);
  };

  const handleReset = () => {
    setActive(null);
    setQuery("");
    setSeeded(true);
    clear();
  };

  const data = active ? lookupAddress(active) : null;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Start
        </Link>
        {data && (
          <button
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#dfddce] hover:opacity-80 transition-opacity"
          >
            <Search className="h-3.5 w-3.5" /> Look up new address
          </button>
        )}
      </div>

      {!data && (
        <>
          <SectionHeader
            eyebrow="Your home"
            title="Look up any Hartford address"
            subtitle="Type an address — yours, a friend's, a place you might rent — or drop a pin on the map."
          />

          <Card className="mb-5">
            <Tabs defaultValue="address" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto bg-secondary/60 p-1 mb-4">
                <TabsTrigger value="address" className="py-1.5 text-xs font-semibold text-[#dfddce] data-[state=active]:text-[#b8860b]">
                  Enter Address
                </TabsTrigger>
                <TabsTrigger value="map" className="py-1.5 text-xs font-semibold text-[#dfddce] data-[state=active]:text-[#b8860b]">
                  Pick on Map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="address">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <label htmlFor="addr" className="block text-sm font-semibold text-foreground">
                    Home address
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
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
              </TabsContent>

              <TabsContent value="map">
                <Suspense fallback={<div className="h-[320px] rounded-xl bg-secondary/40 animate-pulse" />}>
                  <PickAddressMap
                    onPick={(addr) => {
                      setQuery(addr);
                      setActive(addr);
                      save(addr);
                    }}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}

      {data && (
        <>
          <div className="mb-3 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200">
            Demo only — figures below are placeholder data, not live records.
          </div>


          <BuildingStoryDialog data={data} />

          <Card className="mb-5 bg-primary text-primary-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider opacity-70">Showing</p>
                <p className="truncate font-display text-lg">{data.address}</p>
                <p className="text-sm opacity-80">{data.neighborhood} · Built {data.yearBuilt} · {data.units} units</p>
              </div>
            </div>
            <div className="mt-3">
              <Suspense fallback={<div className="h-[180px] rounded-xl bg-black/20 animate-pulse" />}>
                <AddressLocationMap address={data.address} />
              </Suspense>
            </div>
          </Card>

          <Tabs defaultValue="card" className="w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">4 ways to view Home data</p>
            <TabsList className="grid w-full grid-cols-4 h-auto bg-secondary/60 p-1">
              <TabsTrigger value="card" className="py-1.5 text-[11px] font-semibold">Report Card</TabsTrigger>
              <TabsTrigger value="story" className="py-1.5 text-[11px] font-semibold">Detailed</TabsTrigger>
              <TabsTrigger value="share" className="py-1.5 text-[11px] font-semibold">Share</TabsTrigger>
              <TabsTrigger value="print" className="py-1.5 text-[11px] font-semibold">Print</TabsTrigger>
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
            <TabsContent value="print" className="mt-4">
              <PrintReport data={data} />
            </TabsContent>
          </Tabs>

          <div className="mt-5">
            <LandlordCard data={data} />
          </div>

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
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-3 sm:p-4">
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
            <span className="font-display text-2xl leading-none text-foreground sm:text-3xl">{it.value}</span>
            <span className="text-xs font-semibold text-foreground sm:text-sm">{it.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground sm:text-xs">{it.sub}</p>
            <SeverityPill severity={it.severity as "good" | "watch" | "concern"}>{it.severity}</SeverityPill>
          </div>
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
          {" "}Across <strong>{data.landlordPortfolio.propertiesInHartford}</strong> Hartford properties this owner has <strong>{data.landlordPortfolio.totalOpenCodeViolations}</strong> open violations in total.
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
          {" "}This owner filed <strong>{data.landlordPortfolio.totalEvictions12mo}</strong> evictions across their <strong>{data.landlordPortfolio.propertiesInHartford}</strong> Hartford properties in the last year.
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
        <PlainLanguage>
          Across all <strong>{data.landlordPortfolio.propertiesInHartford}</strong> Hartford properties owned by {data.landlord}, residents and neighbors have filed <strong>{data.landlordPortfolio.totalComplaints311_12mo}</strong> 311 complaints in the last 12 months.
        </PlainLanguage>
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

  const [shareStatus, setShareStatus] = useState<null | "copied" | "error">(null);
  const handleShare = async () => {
    const text = `${data.address} — ${data.building.codeViolations.open} open code violations, ${data.building.evictions.filings12mo} evictions filed in the last year. See more on Wake Up Wednesday.`;
    const url = window.location.href;
    const payload = `${text}\n${url}`;

    // Try Web Share API first (works on most mobile browsers, often blocked in iframes)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Wake Up Wednesday", text, url });
        return;
      } catch (err) {
        // User cancelled or iframe blocked it — fall through to clipboard
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    // Clipboard fallback
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

function PrintReport({ data }: { data: Data }) {
  const cv = data.building.codeViolations;
  const ev = data.building.evictions;
  const us = data.building.utilityShutoffs;
  const c311 = data.building.complaints311;

  const handlePrint = async () => {
    const shareUrl = `${window.location.origin}/building?address=${encodeURIComponent(data.address)}`;
    let qrDataUrl = "";
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240, color: { dark: "#14213d", light: "#ffffff" } });
    } catch {}
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wake Up Wednesday — ${escapeHtml(data.address)}</title>
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
      <p class="eyebrow">Wake Up Wednesday · GREATER HARTFORD BRANCH NAACP</p>
      <h1>${escapeHtml(data.address)}</h1>
      <p class="sub">${escapeHtml(data.neighborhood)} · Census Tract ${escapeHtml(data.censusTract)} · Built ${data.yearBuilt} · ${data.units} units · Owner: ${escapeHtml(data.landlord)}</p>
    </div>
    ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code to view this report online"><div>Scan to view<br>or share</div></div>` : ""}
  </div>

  <h2>Report Card</h2>
  <div class="grid">
    <div class="card"><span class="pill ${cv.open > 2 ? "concern" : cv.open > 0 ? "watch" : "good"}">Code violations</span><div class="num">${cv.open}</div><div class="note">${cv.closed12mo} closed in last year</div></div>
    <div class="card"><span class="pill concern">Evictions filed</span><div class="num">${ev.filings12mo}</div><div class="note">${escapeHtml(ev.rate)} of units</div></div>
    <div class="card"><span class="pill ${us.count12mo > 0 ? "watch" : "good"}">Utility shutoffs</span><div class="num">${us.count12mo}</div><div class="note">last 12 months</div></div>
    <div class="card"><span class="pill watch">311 complaints</span><div class="num">${c311.count12mo}</div><div class="note">${escapeHtml(c311.topCategory)}</div></div>
  </div>

  <h2>Code violations</h2>
  <p class="meta">From Hartford Housing Code Enforcement. ${cv.open} open, ${cv.closed12mo} closed in the last year.</p>
  <table><thead><tr><th>Date</th><th>Description</th><th>Status</th></tr></thead><tbody>
    ${cv.recent.map(v => `<tr><td>${escapeHtml(v.date)}</td><td>${escapeHtml(v.description)}</td><td>${escapeHtml(v.status)}</td></tr>`).join("")}
  </tbody></table>
  <div class="plain">Open violations mean the city has asked your landlord to fix something. Call <strong>311</strong> if a problem hasn't been fixed.</div>

  <h2>Evictions filed</h2>
  <p class="meta">${escapeHtml(ev.rate)} of units · ${ev.filings12mo} filings in the last 12 months. ${escapeHtml(ev.note)}</p>
  <div class="plain">If you receive a notice to quit, you have rights. Free legal help: <strong>(860) 541-5000</strong>.</div>

  <h2>Utility shutoffs</h2>
  <p class="meta">${escapeHtml(us.note)}</p>
  <div class="plain">Cold months (Nov–Apr) have shutoff protections if you qualify. Dial <strong>211</strong> for help.</div>

  <h2>311 complaints nearby</h2>
  <p class="meta">Most reported: ${escapeHtml(c311.topCategory)} · ${c311.count12mo} total in last 12 months.</p>
  <table><thead><tr><th>Date</th><th>Type</th></tr></thead><tbody>
    ${c311.recent.map(c => `<tr><td>${escapeHtml(c.date)}</td><td>${escapeHtml(c.type)}</td></tr>`).join("")}
  </tbody></table>

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
        <h3 className="mt-2 font-display text-lg">{data.address}</h3>
        <p className="text-xs text-muted-foreground">{data.neighborhood} · Built {data.yearBuilt} · {data.units} units</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">Code violations</div><div className="font-display text-2xl">{cv.open}</div></div>
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">Evictions</div><div className="font-display text-2xl">{ev.filings12mo}</div></div>
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">Shutoffs</div><div className="font-display text-2xl">{us.count12mo}</div></div>
          <div className="rounded-md border border-border p-2"><div className="text-muted-foreground">311 complaints</div><div className="font-display text-2xl">{c311.count12mo}</div></div>
        </div>
      </div>
    </div>
  );
}

function LandlordCard({ data }: { data: Data }) {
  const c = data.landlordContact;
  const p = data.landlordPortfolio;
  return (
    <Card className="mb-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Owner / Landlord</p>
          <h2 className="font-display text-lg leading-tight">{data.landlord}</h2>

          <div className="mt-3 space-y-1.5 text-sm">
            {c.phone && (
              <p className="flex items-center gap-2 text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">{c.phone}</a>
              </p>
            )}
            {c.email && (
              <p className="flex items-center gap-2 text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`mailto:${c.email}`} className="hover:underline break-all">{c.email}</a>
              </p>
            )}
            {c.mailingAddress && (
              <p className="flex items-start gap-2 text-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <span>{c.mailingAddress}</span>
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" /> This owner's full Hartford portfolio
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <PortfolioStat value={p.propertiesInHartford} label="properties" />
              <PortfolioStat value={p.totalUnits} label="total units" />
              <PortfolioStat value={p.totalOpenCodeViolations} label="open code violations" />
              <PortfolioStat value={p.totalEvictions12mo} label="evictions, last yr" />
              <PortfolioStat value={p.totalComplaints311_12mo} label="311 complaints, last yr" />
            </div>
            {p.note && <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>}
          </div>

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
