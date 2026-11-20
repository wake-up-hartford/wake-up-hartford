import { createFileRoute, Link } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site";
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
} from "lucide-react";
import { useMemo, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { ScriptWord } from "@/components/ScriptWord";
import { buildNeighborhoodIndicators } from "@/lib/neighborhood-indicators";

const search = z.object({
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
      { property: "og:url", content: siteUrl("/neighborhood-actions") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/neighborhood-actions") },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { neighborhood } = Route.useSearch();
  const label = neighborhood || "Your neighborhood";

  const result = useMemo(
    () => (neighborhood ? buildNeighborhoodIndicators(neighborhood) : null),
    [neighborhood],
  );

  const indicators = result?.indicators ?? [];
  const concerns = useMemo(
    () => indicators.filter((i) => i.severity === "concern"),
    [indicators],
  );
  const rentBurdenRed = concerns.some((i) => i.key === "severe_rent");
  const housingAgeRed = concerns.some((i) => i.key === "pre1960");

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/neighborhood"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to report
        </Link>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-tight sm:text-4xl">
        Take Action for Your
        <span className="block font-script text-4xl normal-case leading-none text-pink sm:text-5xl">
          <ScriptWord>Neighborhood</ScriptWord>
        </span>
      </h1>
      <p className="mt-3 text-[13px] leading-snug text-foreground/80">
        Things you can do right now, tailored to what the data shows about this neighborhood.
      </p>

      {/* For you */}
      <GroupHeader>For you & your neighbors</GroupHeader>

      <ActionCard
        icon={ClipboardList}
        accent="cyan"
        pop="pop-cyan"
        title="Start my 30-Day Plan"
        body="A short survey turns YOUR top concerns into a personal stabilization plan — housing, income, food, health."
        cta={
          <Link to="/life" className={primaryBtn}>
            Begin survey <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <ActionCard
        icon={HandHeart}
        accent="pink"
        pop="pop-pink"
        title="Find help near me"
        body="Tell us what you need — housing, food, health, legal, jobs — and we'll show vetted Connecticut organizations that can help."
        cta={
          <Link to="/find-help" search={{ neighborhood }} className={primaryBtn}>
            Start checklist <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {(rentBurdenRed || housingAgeRed) && (
        <ActionCard
          icon={PenLine}
          accent="orange"
          pop="pop-orange"
          title="Write a letter to your landlord"
          body={
            rentBurdenRed
              ? "Rent burden is high here. If your unit has problems, a formal complaint creates a paper trail and your legal protection."
              : "Much of the housing stock here is older. A formal complaint creates a paper trail and your legal protection if there are habitability issues."
          }
          cta={
            <Link to="/landlord-letter" className={primaryBtn}>
              Open the tool <ArrowRight className="h-4 w-4" />
            </Link>
          }
          tag="Recommended for this neighborhood"
        />
      )}

      <ActionCard
        icon={Vote}
        accent="purple"
        pop="pop-purple"
        title="VOTE!"
        body="Turnout in neighborhoods like this one shapes whether the city listens. Two minutes on the CT Secretary of State site."
        cta={
          <div className="flex flex-wrap gap-2">
            <a
              href="https://voterregistration.ct.gov/OLVR/welcome.do"
              target="_blank"
              rel="noreferrer"
              className={primaryBtn}
            >
              Register to Vote <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://portaldir.ct.gov/sots/LookUp.aspx"
              target="_blank"
              rel="noreferrer"
              className={secondaryBtn}
            >
              Check Registration <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        }
      />

      <ActionCard
        icon={MessageSquareWarning}
        accent="cyan"
        pop="pop-cyan"
        title="Help us get it right"
        body="Your first-hand knowledge makes this website better for everyone. Tell us how we can make it better."
        cta={
          <a
            href={`mailto:hello@wakeupwednesday.org?subject=${encodeURIComponent(
              `Ground-truth: ${label}`,
            )}&body=${encodeURIComponent(
              `${label} — what the data gets wrong:\n\n`,
            )}`}
            className={secondaryBtn}
          >
            Email us feedback <ArrowRight className="h-4 w-4" />
          </a>
        }
      />

      <div className="pop-card pop-orange mt-8 overflow-hidden rounded-2xl bg-card p-5 text-card-foreground">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
            <Vote className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl leading-tight">Learn who your State Legislator is</h3>
            <p className="mt-1 text-sm text-card-foreground/80">
              Your State Rep and State Senator can help with housing, utilities, benefits, and neighborhood issues. Find their contact information and reach out.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://www.cga.ct.gov/asp/menu/cgafindleg.asp"
                target="_blank"
                rel="noreferrer"
                className={primaryBtn}
              >
                Find your legislator <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ---------- shared pieces ----------

const primaryBtn =
  "pop-btn inline-flex items-center justify-center gap-2 rounded-full bg-pink px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99]";

const secondaryBtn =
  "pop-btn inline-flex items-center justify-center gap-2 rounded-full bg-card px-4 py-2.5 text-[13px] font-semibold text-card-foreground";

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground first:mt-2">
      {children}
    </h3>
  );
}

const ACCENT: Record<string, string> = {
  pink: "bg-pink/20 text-pink",
  orange: "bg-gold/25 text-gold",
  cyan: "bg-accent/20 text-accent",
  purple: "bg-primary/20 text-primary",
};

function ActionCard({
  icon: Icon,
  accent,
  pop,
  title,
  body,
  cta,
  tag,
}: {
  icon: ComponentType<{ className?: string }>;
  accent: keyof typeof ACCENT | string;
  pop: string;
  title: string;
  body: string;
  cta: React.ReactNode;
  tag?: string;
}) {
  return (
    <div className={`pop-card ${pop} mb-4 rounded-2xl bg-card p-4 text-card-foreground`}>
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${ACCENT[accent] ?? ACCENT.cyan}`}
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
          <p className="mt-1 text-sm text-card-foreground/80">{body}</p>
          <div className="mt-3">{cta}</div>
        </div>
      </div>
    </div>
  );
}
