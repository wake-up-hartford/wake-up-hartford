import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft } from "lucide-react";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display text-3xl text-foreground">About This Tool</h1>

      <Section title="What This Platform Is">
        <p>
          Wake Up is a free, address-based digital platform built with and for residents of Hartford's highest-poverty neighborhoods. Type in your address and see what's happening in your building and your broader neighborhood — then get a personalized plan to help stabilize your life and connect to people fighting to change the conditions that created these realities in the first place.
        </p>
      </Section>

      <Section title="How It Came to Be">
        <p>
          Wake Up Wednesday launched in August 2023 as a community response to a series of murders in North Hartford. Every Wednesday since, NAACP Greater Hartford Branch volunteers have set up a tent at Unity Plaza on Barbour Street — offering food, support, and direct assistance to residents week after week.
        </p>
        <p>
          Over time, it became clear that residents needed more than presence. They needed information. Data about their buildings, their neighborhoods, and their rights existed — but it was locked inside government databases, legal documents, and research reports that were never built for the people most affected.
        </p>
        <p>
          Wake Up was built to change that. Developed through a partnership between the NAACP Greater Hartford Branch and Farnam Associates, and powered by data from the CT Data Collaborative, this platform puts that information directly in residents' hands — alongside the tools to act on it.
        </p>
      </Section>

      <Section title="Who It's For">
        <p>
          This platform was built for residents of Hartford's 19 highest-poverty census tracts — and for the advocates, legal aid attorneys, tenant organizers, and community partners working alongside them. It is not a government tool. It is not an academic tool. It belongs to the community.
        </p>
      </Section>

      <Section title="Our Partners">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>NAACP Greater Hartford Branch</strong> — Organizational lead and community anchor</li>
          <li><strong>CT Data Collaborative</strong> — Primary data infrastructure and technical partner</li>
          <li><strong>Farnam Associates, LLC</strong> — Platform design and development</li>
          <li><strong>Wake Up Wednesday Community Partners</strong> — Program referrals</li>
        </ul>
      </Section>

      <Section title="Credits">
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
      </Section>

      <Section title="Data Sources & Methodology">
        <p>
          The data powering this platform comes from public records, city systems, and research infrastructure maintained by the CT Data Collaborative. Neighborhood-level data is updated quarterly. Property and landlord data reflects the most current available records. All data has limitations — we are transparent about those limitations and committed to improving accuracy over time. If you believe something is incorrect, contact us.
        </p>
      </Section>

      <Section title="Privacy & Data Use">
        <p>
          We collect only what you choose to share. Your address is used to generate your neighborhood and housing profile — it is not stored or shared. If you complete the Your Life intake and provide your email, that information is used only to send your stabilization plan and, if you opt in, updates from the NAACP Greater Hartford Branch. We will never sell your data. Ever.
        </p>
      </Section>

      <Section title="A Note on Replicability">
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
      </Section>

      <Section title="Federal Funding Disclosure">
        <p>
          This project is supported, in whole or in part, by federal award number SLFRP0128 awarded to the State of Connecticut by the U.S. Department of the Treasury.
        </p>
      </Section>

      <Section title="Contact">
        <p className="text-[13px] text-muted-foreground italic">[Organization contact email]</p>
        <p className="text-[13px] text-muted-foreground italic">[NAACP Greater Hartford Branch website or address]</p>
        <p className="text-[13px] text-muted-foreground italic">[Wake Up Wednesday social media links]</p>
      </Section>
    </AppShell>
  );
}
