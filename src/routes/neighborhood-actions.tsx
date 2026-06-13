import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ChevronLeft,
  HandHeart,
  ClipboardList,
  PenLine,
  Vote,
  MessageSquareWarning,
  ArrowRight,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { useMemo, type ComponentType } from "react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getTractIndicators } from "@/lib/tract-indicators.functions";

const search = z.object({
  state: fallback(z.string().regex(/^\d{2}$/), "09").default("09"),
  county: fallback(z.string().regex(/^\d{3}$/), "003").default("003"),
  tract: fallback(z.string().regex(/^\d{6}$/), "500100").default("500100"),
  name: fallback(z.string(), "").default(""),
  neighborhood: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/neighborhood-actions")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Take Action — Wake Up Wednesday" },
      {
        name: "description",
        content:
          "Concrete actions you can take based on what the data shows about your neighborhood.",
      },
      { property: "og:title", content: "Take Action — Wake Up Wednesday" },
      { property: "og:description", content: "Concrete actions you can take based on what the data shows about your neighborhood." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/neighborhood-actions" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/neighborhood-actions" },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { state, county, tract, name, neighborhood } = Route.useSearch();
  const tractName = name || tract;
  const tractLabel = neighborhood || `Tract ${tractName}`;

  const fetchIndicators = useServerFn(getTractIndicators);
  const { data, isLoading } = useQuery({
    queryKey: ["tract-indicators", state, county, tract],
    queryFn: () => fetchIndicators({ data: { state, county, tract } }),
    staleTime: 1000 * 60 * 60,
  });

  const indicators = data?.indicators ?? [];
  const concerns = useMemo(
    () => indicators.filter((i) => i.severity === "concern"),
    [indicators],
  );
  const rentBurdenRed = concerns.some((i) => i.key === "rent_burden");
  const housingAgeRed = concerns.some((i) => i.key === "housing_age" || i.key === "age_of_housing");

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/neighborhood"
          search={{ state, county, tract, name, neighborhood }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to report
        </Link>
      </div>

      <SectionHeader
        eyebrow={tractLabel}
        title="Take action for your neighborhood"
        subtitle="Things you can do right now, tailored to what the data shows about this tract."
      />

      {/* For you */}
      <GroupHeader>For you & your neighbors</GroupHeader>

      <ActionCard
        icon={ClipboardList}
        accent="sky"
        title="Start my 30-Day Plan"
        body="A short survey turns YOUR top concerns into a personal stabilization plan — housing, income, food, health."
        cta={
          <Link to="/life">
            <Button size="sm">
              Begin survey <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      <ActionCard
        icon={HandHeart}
        accent="emerald"
        title="Find help near me"
        body="Tell us what you need — housing, food, health, legal, jobs — and we'll show vetted Connecticut organizations that can help."
        cta={
          <Link
            to="/find-help"
            search={{ state, county, tract, name, neighborhood }}
          >
            <Button size="sm">
              Start checklist <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {(rentBurdenRed || housingAgeRed) && (
        <ActionCard
          icon={PenLine}
          accent="rose"
          title="Write a letter to your landlord"
          body={
            rentBurdenRed
              ? "Rent burden is high here. If your unit has problems, a formal complaint creates a paper trail and your legal protection."
              : "Much of the housing stock here is older. A formal complaint creates a paper trail and your legal protection if there are habitability issues."
          }
          cta={
            <Link to="/landlord-letter">
              <Button size="sm">
                Open the tool <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          }
          tag="Recommended for this tract"
        />
      )}

      <ActionCard
        icon={Vote}
        accent="amber"
        title="VOTE!"
        body="Turnout in tracts like this one shapes whether the city listens. Two minutes on the CT Secretary of State site."
        cta={
          <div className="flex flex-wrap gap-2">
            <a
              href="https://voterregistration.ct.gov/OLVR/welcome.do"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm">
                Register to Vote <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </a>
            <a
              href="https://portaldir.ct.gov/sots/LookUp.aspx"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300"
              >
                Check Registration <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        }
      />


      <ActionCard
        icon={MessageSquareWarning}
        accent="slate"
        title="Report what's missing"
        body="The numbers here don't match what you're seeing on the ground? Tell us. Ground-truth from residents makes this report better."
        cta={
          <a
            href={`mailto:hello@wakeupwednesday.org?subject=${encodeURIComponent(
              `Ground-truth: ${tractLabel}`,
            )}&body=${encodeURIComponent(
              `Tract ${tractName} — what the data gets wrong:\n\n`,
            )}`}
          >
            <Button size="sm" variant="outline">
              Send feedback <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
        }
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-gold/40 bg-gold/15 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl leading-tight">Ready to do something?</h3>
            <p className="mt-1 text-sm text-foreground/80">
              Find help, email your State Rep, or take a survey to create a Life Plan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/find-help"
                search={{ state, county, tract, name, neighborhood }}
              >
                <Button size="sm">Find help</Button>
              </Link>
              <a
                href="https://www.cga.ct.gov/asp/menu/FindYourLegislator.asp"
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline">
                  Email State Rep <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </a>
              <Link to="/life">
                <Button size="sm" variant="outline">
                  Create Life Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ---------- shared pieces ----------

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground first:mt-2">
      {children}
    </h3>
  );
}

const ACCENT: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-300",
  sky: "bg-sky-500/20 text-sky-300",
  rose: "bg-rose-500/20 text-rose-300",
  amber: "bg-amber-500/20 text-amber-300",
  gold: "bg-gold/25 text-gold",
  indigo: "bg-indigo-500/20 text-indigo-300",
  slate: "bg-accent/20 text-accent",
};

function ActionCard({
  icon: Icon,
  accent,
  title,
  body,
  cta,
  tag,
}: {
  icon: ComponentType<{ className?: string }>;
  accent: keyof typeof ACCENT | string;
  title: string;
  body: string;
  cta: React.ReactNode;
  tag?: string;
}) {
  return (
    <Card className="mb-4">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${ACCENT[accent] ?? ACCENT.emerald}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg leading-tight">{title}</h2>
            {tag && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                {tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground/80">{body}</p>
          <div className="mt-3">{cta}</div>
        </div>
      </div>
    </Card>
  );
}

