import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, TrendingUp, DollarSign, Home as HomeIcon, Printer, Share2, Play, MapPin, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/neighborhood")({
  head: () => ({
    meta: [
      { title: "Your Neighborhood — Wake Up Wednesday" },
      { name: "description", content: "Census tract data and a plain-language report card for your Hartford neighborhood." },
    ],
  }),
  component: NeighborhoodPage,
});

function NeighborhoodPage() {
  const { address, save } = useStoredAddress();
  const data = lookupAddress(address ?? "");

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Start
      </Link>

      <CensusTractLookup onResolved={(addr) => save(addr)} />

      <SectionHeader
        eyebrow={`Census Tract ${data.censusTract}`}
        title={data.neighborhood}
        subtitle="A snapshot of how your neighborhood is doing today, in everyday language."
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-2.5">
        <Stat icon={DollarSign} label="Median income" value={data.area.medianIncome} />
        <Stat icon={HomeIcon} label="Homeowners" value={data.area.homeownership} />
        <Stat icon={TrendingUp} label="Rent burden" value="58%" small />
      </div>

      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto bg-secondary/60 p-1">
          <TabsTrigger value="card" className="py-1.5 text-[11px] font-semibold">Report Card</TabsTrigger>
          <TabsTrigger value="story" className="py-1.5 text-[11px] font-semibold">Detailed</TabsTrigger>
          <TabsTrigger value="share" className="py-1.5 text-[11px] font-semibold">Share</TabsTrigger>
          <TabsTrigger value="print" className="py-1.5 text-[11px] font-semibold">Print</TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="mt-4">
          <NeighborhoodReportCard data={data} />
        </TabsContent>
        <TabsContent value="story" className="mt-4">
          <NeighborhoodDetailed data={data} />
        </TabsContent>
        <TabsContent value="share" className="mt-4">
          <NeighborhoodShare data={data} />
        </TabsContent>
        <TabsContent value="print" className="mt-4">
          <NeighborhoodPrint data={data} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

type Data = ReturnType<typeof lookupAddress>;

function NeighborhoodReportCard({ data }: { data: Data }) {
  return (
    <Card className="mb-4">
      <h2 className="mb-1 font-display text-xl text-card-foreground">Neighborhood report card</h2>
      <p className="mb-4 text-sm text-muted-foreground">Six categories that shape daily life on your block.</p>
      <ul className="divide-y divide-border">
        {data.area.reportCard.map((c) => (
          <li key={c.category} className="flex items-start justify-between gap-3 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl leading-none text-card-foreground">{c.grade}</span>
                <p className="font-medium text-card-foreground">{c.category}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
            </div>
            <SeverityPill severity={c.severity}>
              {c.severity === "good" ? "OK" : c.severity === "watch" ? "Watch" : "Concern"}
            </SeverityPill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NeighborhoodDetailed({ data }: { data: Data }) {
  return (
    <div className="space-y-4">
      {data.area.reportCard.map((c) => (
        <Card key={c.category}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="font-display text-3xl leading-none text-card-foreground">{c.grade}</span>
              <div>
                <h3 className="font-display text-lg leading-tight text-card-foreground">{c.category}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
              </div>
            </div>
            <SeverityPill severity={c.severity}>
              {c.severity === "good" ? "OK" : c.severity === "watch" ? "Watch" : "Concern"}
            </SeverityPill>
          </div>
        </Card>
      ))}
      <Card>
        <h3 className="mb-2 font-display text-lg text-card-foreground">What this means</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A "watch" or "concern" rating doesn't mean your neighborhood is bad — it means there's an
          issue worth knowing about. Every Wednesday at Unity Plaza, neighbors meet to talk about
          what to do next, together.
        </p>
      </Card>
    </div>
  );
}

function NeighborhoodShare({ data }: { data: Data }) {
  const slides = [
    { eyebrow: "Wake Up Wednesday", title: data.neighborhood, body: `Census Tract ${data.censusTract} · Hartford` },
    ...data.area.reportCard.slice(0, 4).map((c) => ({
      eyebrow: c.category,
      title: c.grade,
      body: c.note,
    })),
  ];
  const [i, setI] = useState(0);
  const slide = slides[i];
  const [shareStatus, setShareStatus] = useState<null | "copied" | "error">(null);

  const handleShare = async () => {
    const concerns = data.area.reportCard.filter((c) => c.severity === "concern").map((c) => c.category).join(", ");
    const text = `${data.neighborhood} (Hartford) — ${concerns ? `concerns: ${concerns}.` : "neighborhood report card."} See more on Wake Up Wednesday.`;
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

function NeighborhoodPrint({ data }: { data: Data }) {
  const handlePrint = async () => {
    const shareUrl = `${window.location.origin}/neighborhood`;
    let qrDataUrl = "";
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240, color: { dark: "#14213d", light: "#ffffff" } });
    } catch {}
    const rows = data.area.reportCard
      .map(
        (c) =>
          `<tr><td><strong>${escapeHtml(c.grade)}</strong></td><td>${escapeHtml(c.category)}</td><td>${escapeHtml(c.note)}</td><td><span class="pill ${c.severity}">${c.severity}</span></td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wake Up Wednesday — ${escapeHtml(data.neighborhood)}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #14213d; margin: 0; line-height: 1.45; }
  .eyebrow { font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8860b; margin: 0 0 6px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 18px 0 8px; border-bottom: 1px solid #d6cfc1; padding-bottom: 4px; }
  .sub { font-family: Arial, sans-serif; font-size: 12px; color: #555; margin: 0 0 14px; }
  .pill { display: inline-block; font-family: Arial, sans-serif; font-size: 9px; padding: 2px 7px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold; }
  .good { background:#e6f4ea; color:#1e6b3a; } .watch{ background:#fff4d6; color:#7a5a00; } .concern{ background:#fde2e1; color:#a11d1d; }
  table { width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; margin-top: 6px; }
  th, td { text-align:left; padding: 8px 6px; border-bottom: 1px solid #ece7da; vertical-align: top; }
  th { color:#555; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
  .stat { border: 1px solid #d6cfc1; border-radius: 8px; padding: 10px 12px; }
  .stat .label { font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
  .stat .num { font-size: 22px; font-weight: bold; margin: 4px 0 0; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #d6cfc1; font-family: Arial, sans-serif; font-size: 10px; color:#555; display:flex; justify-content:space-between; }
  .header { display:flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
  .header .titles { flex: 1; min-width: 0; }
  .qr { text-align:center; font-family: Arial, sans-serif; font-size: 9px; color:#555; line-height:1.3; }
  .qr img { display:block; width: 96px; height: 96px; }
</style></head><body>
  <div class="header">
    <div class="titles">
      <p class="eyebrow">Wake Up Wednesday · NAACP Greater Hartford</p>
      <h1>${escapeHtml(data.neighborhood)}</h1>
      <p class="sub">Census Tract ${escapeHtml(data.censusTract)} · Hartford, CT</p>
    </div>
    ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code to view this report online"><div>Scan to view<br>or share</div></div>` : ""}
  </div>

  <h2>Neighborhood snapshot</h2>
  <div class="stats">
    <div class="stat"><div class="label">Median income</div><div class="num">${escapeHtml(data.area.medianIncome)}</div></div>
    <div class="stat"><div class="label">Homeowners</div><div class="num">${escapeHtml(data.area.homeownership)}</div></div>
    <div class="stat"><div class="label">Rent burden</div><div class="num">58%</div></div>
  </div>

  <h2>Report card</h2>
  <table><thead><tr><th>Grade</th><th>Category</th><th>Notes</th><th>Status</th></tr></thead><tbody>
    ${rows}
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
            <h2 className="font-display text-xl leading-tight text-card-foreground">Printable PDF report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A one-page neighborhood summary — perfect for handing to a neighbor, council member, or community meeting.
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

      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
        <h3 className="mt-2 font-display text-lg text-card-foreground">{data.neighborhood}</h3>
        <p className="text-xs text-muted-foreground">Census Tract {data.censusTract} · Hartford</p>
        <ul className="mt-3 space-y-1.5 text-xs">
          {data.area.reportCard.map((c) => (
            <li key={c.category} className="flex items-center justify-between gap-2 text-card-foreground">
              <span><strong>{c.grade}</strong> · {c.category}</span>
              <span className="text-muted-foreground capitalize">{c.severity}</span>
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

function Stat({ icon: Icon, label, value, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; small?: boolean }) {
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
      <p className={`font-display leading-tight text-card-foreground ${small ? "text-base" : "text-lg"} sm:${small ? "text-lg" : "text-xl"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground sm:text-[11px]">{label}</p>
    </div>
  );
}
