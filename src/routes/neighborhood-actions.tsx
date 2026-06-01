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
  ShieldCheck,
  Megaphone,
  Users,
  MessageSquareWarning,
  ArrowRight,
  ExternalLink,
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
  const multipleRed = concerns.length >= 3;

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

      <ActionCard
        icon={ClipboardList}
        accent="sky"
        title="Start my 30-Day Plan"
        body="A short survey turns this tract's top concerns into a personal stabilization plan — housing, income, food, health."
        cta={
          <Link to="/life">
            <Button size="sm">
              Begin survey <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
        title="Register to vote (or check your registration)"
        body="Turnout in tracts like this one shapes whether the city listens. Two minutes on the CT Secretary of State site."
        cta={
          <a
            href="https://portaldir.ct.gov/sots/LookUp.aspx"
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm">
              Check registration <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
        }
      />

      <ActionCard
        icon={ShieldCheck}
        accent="emerald"
        title="Know Your Rights card"
        body={
          concerns.length > 0
            ? `A printable one-pager built around the top issues here: ${concerns.slice(0, 2).map((c) => c.label.toLowerCase()).join(" and ")}.`
            : "A printable one-pager covering tenant rights, SNAP eligibility, and where to call if something goes wrong."
        }
        cta={
          <Button size="sm" variant="outline" disabled>
            Coming soon
          </Button>
        }
      />

      {/* Organizing */}
      <GroupHeader>Organize this block</GroupHeader>

      <ActionCard
        icon={Megaphone}
        accent="gold"
        title="Host a Wake Up Wednesday here"
        body={
          multipleRed
            ? "Multiple indicators are red in this tract — it's a strong candidate for an in-person meeting. We'll help you find a space and bring the right partners."
            : "Bring neighbors together for a one-hour conversation. We'll help you find a space and bring the right partners."
        }
        cta={
          <a href="mailto:hello@wakeupwednesday.org?subject=Host%20a%20Wake%20Up%20Wednesday">
            <Button size="sm">
              Volunteer to host <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
        }
        tag={multipleRed ? "Suggested for this tract" : undefined}
      />

      <ActionCard
        icon={Users}
        accent="indigo"
        title="Become a Block Captain"
        body="Be the trusted point person for your block — share what you see, connect neighbors to resources, and help us keep the data honest."
        cta={
          <a href="mailto:hello@wakeupwednesday.org?subject=Block%20Captain%20interest">
            <Button size="sm">
              Sign up <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
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

