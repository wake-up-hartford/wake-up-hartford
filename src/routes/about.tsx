import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useState, useCallback } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About This Tool — Wake Up Wednesday" },
      { name: "description", content: "Learn about the Wake Up Wednesday tool from the Greater Hartford Branch NAACP." },
      { property: "og:title", content: "About This Tool — Wake Up Wednesday" },
      { property: "og:description", content: "Learn about the Wake Up Wednesday tool from the Greater Hartford Branch NAACP." },
    ],
  }),
  component: AboutPage,
});

const SECTIONS = [
  { id: "what", title: "What This Platform Is" },
  { id: "how", title: "How It Came to Be" },
  { id: "who", title: "Who It's For" },
  { id: "partners", title: "Our Partners" },
  { id: "credits", title: "Credits" },
  { id: "data", title: "Data Sources & Methodology" },
  { id: "privacy", title: "Privacy & Data Use" },
  { id: "replicability", title: "A Note on Replicability" },
  { id: "funding", title: "Federal Funding Disclosure" },
  { id: "contact", title: "Contact" },
];

function Toc({ onJump }: { onJump: (id: string) => void }) {
  return (
    <nav className="mt-5 rounded-xl border border-border p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Jump to a section
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map(({ id, title }) => (
          <button
            key={id}
            onClick={() => onJump(id)}
            className="rounded-lg border border-border/80 px-2.5 py-1 text-[12px] text-foreground transition-colors hover:bg-muted/40"
          >
            {title}
          </button>
        ))}
      </div>
    </nav>
  );
}

function CollapsibleSection({
  id,
  title,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted/20">
            <h2 className="font-display text-[16px] tracking-tight text-foreground">{title}</h2>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 rounded-xl border border-border/60 px-4 py-4 text-[15px] leading-relaxed text-foreground/80">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function AboutPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  }, []);

  const handleJump = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display text-3xl text-foreground">About This Tool</h1>

      <Toc onJump={handleJump} />

      <div className="mt-6 space-y-3">
        <CollapsibleSection id="what" title="What This Platform Is" open={!!openSections["what"]} onOpenChange={(open) => handleOpenChange("what", open)}>
          <p>
            Wake Up is a free, address-based digital platform built with and for residents of Hartford's highest-poverty neighborhoods. Type in your address and see what's happening in your building and your broader neighborhood — then get a personalized plan to help stabilize your life and connect to people fighting to change the conditions that created these realities in the first place.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="how" title="How It Came to Be" open={!!openSections["how"]} onOpenChange={(open) => handleOpenChange("how", open)}>
          <p>
            Wake Up Wednesday launched in August 2023 as a community response to a series of murders in North Hartford. Every Wednesday since, NAACP Greater Hartford Branch volunteers have set up a tent at Unity Plaza on Barbour Street — offering food, support, and direct assistance to residents week after week.
          </p>
          <p>
            Over time, it became clear that residents needed more than presence. They needed information. Data about their buildings, their neighborhoods, and their rights existed — but it was locked inside government databases, legal documents, and research reports that were never built for the people most affected.
          </p>
          <p>
            Wake Up was built to change that. Developed through a partnership between the NAACP Greater Hartford Branch and Farnam Associates, and powered by data from the CT Data Collaborative, this platform puts that information directly in residents' hands — alongside the tools to act on it.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="who" title="Who It's For" open={!!openSections["who"]} onOpenChange={(open) => handleOpenChange("who", open)}>
          <p>
            This platform was built for residents of Hartford's 19 highest-poverty census tracts — and for the advocates, legal aid attorneys, tenant organizers, and community partners working alongside them. It is not a government tool. It is not an academic tool. It belongs to the community.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="partners" title="Our Partners" open={!!openSections["partners"]} onOpenChange={(open) => handleOpenChange("partners", open)}>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>NAACP Greater Hartford Branch</strong> — Organizational lead and community anchor</li>
            <li><strong>CT Data Collaborative</strong> — Primary data infrastructure and technical partner</li>
            <li><strong>Farnam Associates, LLC</strong> — Platform design and development</li>
            <li><strong>Wake Up Wednesday Community Partners</strong> — Program referrals</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection id="credits" title="Credits" open={!!openSections["credits"]} onOpenChange={(open) => handleOpenChange("credits", open)}>
          <p>Designed and developed by Joanne Sciulli, Farnam Associates, LLC</p>
          <p>Built for and with Wake Up Wednesday, NAACP Greater Hartford Branch</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Data sourced from:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
            <li>CT Data Collaborative</li>
            <li>Hartford Assessor records</li>
            <li>CT land records</li>
            <li>CT Secretary of State business registry</li>
            <li>U.S. Census / American Community Survey</li>
            <li>Hartford 311</li>
            <li>Hartford Fair Rent Commission</li>
            <li>USDA Food Access Research Atlas</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection id="data" title="Data Sources & Methodology" open={!!openSections["data"]} onOpenChange={(open) => handleOpenChange("data", open)}>
          <p>
            The data powering this platform comes from public records, city systems, and research infrastructure maintained by the CT Data Collaborative. Neighborhood-level data is updated quarterly. Property and landlord data reflects the most current available records. All data has limitations — we are transparent about those limitations and committed to improving accuracy over time. If you believe something is incorrect, contact us.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="privacy" title="Privacy & Data Use" open={!!openSections["privacy"]} onOpenChange={(open) => handleOpenChange("privacy", open)}>
          <p>
            We collect only what you choose to share. Your address is used to generate your neighborhood and housing profile — it is not stored or shared. If you complete the Your Life intake and provide your email, that information is used only to send your stabilization plan and, if you opt in, updates from the NAACP Greater Hartford Branch. We will never sell your data. Ever.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="replicability" title="A Note on Replicability" open={!!openSections["replicability"]} onOpenChange={(open) => handleOpenChange("replicability", open)}>
          <p>
            Concentrated poverty is not unique to Hartford. The conditions documented here — disinvestment, housing instability, fragmented systems, data locked away from the people it describes — exist in communities across the country.
          </p>
          <p>
            Wake Up was designed from the beginning to be replicable. The platform's architecture, data methodology, and community engagement model can be adapted for other cities and regions facing concentrated poverty.
          </p>
          <p>
            If you represent a community, organization, or funder interested in bringing this model to your city, we want to hear from you. Replication requires partnership — this platform cannot simply be copied or deployed without the community infrastructure, data relationships, and local trust that make it work. Any replication must be done in collaboration with NAACP Greater Hartford Branch.
          </p>
          <p className="text-[13px] text-muted-foreground italic">
            To start a conversation: [contact email]
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="funding" title="Federal Funding Disclosure" open={!!openSections["funding"]} onOpenChange={(open) => handleOpenChange("funding", open)}>
          <p>
            This project is supported, in whole or in part, by federal award number SLFRP0128 awarded to the State of Connecticut by the U.S. Department of the Treasury.
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="contact" title="Contact" open={!!openSections["contact"]} onOpenChange={(open) => handleOpenChange("contact", open)}>
          <p className="text-[13px] text-muted-foreground italic">[Organization contact email]</p>
          <p className="text-[13px] text-muted-foreground italic">[NAACP Greater Hartford Branch website or address]</p>
          <p className="text-[13px] text-muted-foreground italic">[Wake Up Wednesday social media links]</p>
        </CollapsibleSection>
      </div>
    </AppShell>
  );
}
