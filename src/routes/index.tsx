import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search, Calendar, Building2, Trees, HeartHandshake } from "lucide-react";
import { useState } from "react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wake Up Wednesday — Know your home, your block, your rights" },
      { name: "description", content: "A community guide from NAACP Greater Hartford. Enter your address to see plain-language information about your housing and neighborhood." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { address, save, clear } = useStoredAddress();
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    save(input.trim());
  };

  if (address) {
    const data = lookupAddress(address);
    return (
      <AppShell>
        <SectionHeader
          eyebrow="Your home"
          title={`Good morning,${"\u00A0"}neighbor.`}
          subtitle="Here's what we know about your home and block today."
        />

        <Card className="mb-5 border-primary/15 bg-primary text-primary-foreground">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider opacity-70">Looking up</p>
              <p className="truncate font-display text-lg">{data.address}</p>
              <p className="text-sm opacity-80">{data.neighborhood} · Census Tract {data.censusTract}</p>
            </div>
          </div>
          <button
            onClick={clear}
            className="mt-4 text-[12px] underline-offset-4 opacity-70 hover:underline"
          >
            Change address
          </button>
        </Card>

        <div className="grid gap-3">
          <DashLink
            to="/building"
            icon={Building2}
            title="Your Building"
            body={`${data.building.codeViolations.open} open code issues · ${data.building.evictions.filings12mo} evictions filed`}
            tone="warning"
          />
          <DashLink
            to="/neighborhood"
            icon={Trees}
            title="Your Neighborhood"
            body={`Report card for ${data.neighborhood} · 6 categories`}
            tone="default"
          />
          <DashLink
            to="/life"
            icon={HeartHandshake}
            title="Your Life"
            body="Resources for stability, health, and safety"
            tone="default"
            badge="Coming soon"
          />
        </div>

        <EventCard />
        <Footer />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Wake Up Wednesday"
        title="Know your home. Know your block. Know your rights."
        subtitle="A community guide from NAACP Greater Hartford. Enter your Hartford address to see plain-language information about your housing and neighborhood — no jargon, no judgment."
      />

      <Card className="mb-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="addr" className="block text-sm font-semibold text-foreground">
            Enter your home address
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              id="addr"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="247 Garden Street, Hartford"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              autoComplete="street-address"
              inputMode="text"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            See my report
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[12px] text-muted-foreground">
            Your address stays on your phone. We don't store or share it.
          </p>
        </form>
      </Card>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <MiniCard icon={Building2} label="Building" />
        <MiniCard icon={Trees} label="Neighborhood" />
        <MiniCard icon={HeartHandshake} label="Resources" />
      </div>

      <EventCard />
      <Footer />
    </AppShell>
  );
}

function DashLink({
  to, icon: Icon, title, body, tone, badge,
}: {
  to: "/building" | "/neighborhood" | "/life";
  icon: React.ComponentType<{ className?: string }>;
  title: string; body: string; tone: "default" | "warning"; badge?: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className={`flex items-center gap-4 transition active:scale-[0.99] ${tone === "warning" ? "border-l-4 border-l-gold" : ""}`}>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg leading-tight">{title}</h3>
            {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{badge}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </Card>
    </Link>
  );
}

function MiniCard({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function EventCard() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15">
      <div className="flex items-start gap-3 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Join us</p>
          <h3 className="font-display text-xl leading-tight">Every Wednesday</h3>
          <p className="mt-1 text-sm text-foreground/80">
            Unity Plaza · Barbour Street · Hartford. Coffee, conversation, and your neighbors.
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 space-y-2 text-center text-[12px] text-muted-foreground">
      <p>Presented by <strong className="font-semibold text-foreground">NAACP Greater Hartford</strong></p>
      <p>Data partnership with CT Data Collaborative</p>
    </footer>
  );
}
