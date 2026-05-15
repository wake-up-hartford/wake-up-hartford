import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, TrendingUp, DollarSign, Home as HomeIcon } from "lucide-react";
import { AppShell, Card, SectionHeader, SeverityPill } from "@/components/AppShell";
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
  const { address } = useStoredAddress();
  const data = lookupAddress(address ?? "");

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back home
      </Link>

      <SectionHeader
        eyebrow={`Census Tract ${data.censusTract}`}
        title={data.neighborhood}
        subtitle="A snapshot of how your neighborhood is doing today, in everyday language."
      />

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <Stat icon={DollarSign} label="Median income" value={data.neighborhood.medianIncome} />
        <Stat icon={HomeIcon} label="Homeowners" value={data.neighborhood.homeownership} />
        <Stat icon={TrendingUp} label="Rent burden" value="58%" small />
      </div>

      <Card className="mb-4">
        <h2 className="mb-1 font-display text-xl">Neighborhood report card</h2>
        <p className="mb-4 text-sm text-muted-foreground">Six categories that shape daily life on your block.</p>
        <ul className="divide-y divide-border">
          {data.neighborhood.reportCard.map((c) => (
            <li key={c.category} className="flex items-start justify-between gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl leading-none">{c.grade}</span>
                  <p className="font-medium text-foreground">{c.category}</p>
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

      <Card>
        <h3 className="mb-2 font-display text-lg">What this means</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A "watch" or "concern" rating doesn't mean your neighborhood is bad — it means there's an
          issue worth knowing about. Every Wednesday at Unity Plaza, neighbors meet to talk about
          what to do next, together.
        </p>
      </Card>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Icon className="mb-1.5 h-4 w-4 text-gold" />
      <p className={`font-display ${small ? "text-base" : "text-lg"} leading-tight text-foreground`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
