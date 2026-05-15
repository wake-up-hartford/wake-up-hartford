import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FileWarning, Zap, Phone, ChevronLeft } from "lucide-react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/building")({
  head: () => ({
    meta: [
      { title: "Your Building — Wake Up Wednesday" },
      { name: "description", content: "Code violations, evictions, utility shutoffs, and 311 complaints at your Hartford address." },
    ],
  }),
  component: BuildingPage,
});

function BuildingPage() {
  const { address } = useStoredAddress();
  const data = lookupAddress(address ?? "");

  return (
    <AppShell>
      <BackLink />
      <SectionHeader
        eyebrow="Your building"
        title="What's happening at home"
        subtitle={address ? `${data.address} · Built ${data.yearBuilt} · ${data.units} units` : "Sample building data — add your address to personalize."}
      />

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
                <p className="text-sm text-muted-foreground">Court records for this building, last 12 months.</p>
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
    </AppShell>
  );
}

function PlainLanguage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-secondary/70 p-3.5 text-sm leading-relaxed text-secondary-foreground">
      {children}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="h-4 w-4" /> Back home
    </Link>
  );
}
