import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Trees, HeartHandshake, ArrowRight, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import wakeUpLogo from "@/assets/wake-up-hartford.png.asset.json";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Wake Up Wednesday — Know Your Home. Know Your Block." },
      {
        name: "description",
        content:
          "A community guide from the Greater Hartford Branch NAACP. Plain-language data about your home, your neighborhood, and your life.",
      },
      { property: "og:title", content: "Wake Up Wednesday — Landing (Preview)" },
      {
        property: "og:description",
        content: "See the facts. Find the resources. Build the plan.",
      },
    ],
  }),
  component: PreviewLanding,
});

function PreviewLanding() {
  const { user } = useAuth();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="w-full px-4 pt-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Greater Hartford NAACP presents
        </p>
      </div>
      <img
        src={wakeUpLogo.url}
        alt="Wake Up Hartford"
        className="block w-full h-auto sm:max-w-md sm:mx-auto md:max-w-lg lg:max-w-xl"
      />
      <p className="mx-auto max-w-md px-6 pb-2 text-center text-base font-medium text-foreground/80 sm:max-w-lg sm:text-lg">
        A tool for residents to learn the facts about their neighborhood, their home and get the tools to stabilize their lives.
      </p>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-20 sm:py-28">
          <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Greater Hartford Branch NAACP
          </span>
          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl">
            <span className="text-primary">See it.</span>{" "}
            <span className="text-gold">Name it.</span>{" "}
            <span className="text-accent">Fix it.</span>
          </h1>
          <p className="max-w-xl text-base text-foreground/80 sm:text-lg">
            Real data about your home, your block, and the resources around you —
            in plain language, with a path forward.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={user ? "/home" : "/auth"}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
            >
              {user ? "Open your dashboard" : "Get started"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-card-foreground hover:bg-secondary/50"
            >
              View original homepage
            </Link>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl">Three ways to start</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pick the part of life you want to understand first. Everything links
          together.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Pillar
            to="/neighborhood"
            icon={Trees}
            title="Your Neighborhood"
            body="A report card for your block — air, schools, safety, access."
            accent="text-gold"
            ring="ring-gold/30"
          />
          <Pillar
            to="/home"
            icon={Building2}
            title="Your Home"
            body="Look up any Hartford address. Code issues, evictions, utilities."
            accent="text-primary"
            ring="ring-primary/30"
          />
          <Pillar
            to="/life"
            icon={HeartHandshake}
            title="Your Life"
            body="Resources for stability, health, and safety."
            accent="text-accent"
            ring="ring-accent/30"
          />
        </div>
      </section>

      {/* Event strip */}
      <section className="border-y border-gold/30 bg-gold/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/85">
                Join us
              </p>
              <h3 className="font-display text-xl leading-tight">Every Wednesday</h3>
              <p className="text-sm text-foreground/80">
                Unity Plaza · Barbour Street · Hartford. Coffee, conversation,
                and your neighbors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl">
          Knowledge is where change begins.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-foreground/75">
          Sign in to save your plan, track your block, and pick up where you
          left off.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to={user ? "/profile" : "/auth"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {user ? "Go to your account" : "Create your account"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-[13px] text-foreground/70">
        Presented by{" "}
        <strong className="font-semibold text-foreground">
          GREATER HARTFORD BRANCH NAACP
        </strong>
      </footer>
    </main>
  );
}

function Pillar({
  to,
  icon: Icon,
  title,
  body,
  accent,
  ring,
}: {
  to: "/home" | "/neighborhood" | "/life";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent: string;
  ring: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 ring-1 ${ring} transition hover:-translate-y-0.5 hover:shadow-soft`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`font-display text-lg leading-tight ${accent}`}>{title}</h3>
      <p className="text-sm text-card-foreground/80">{body}</p>
      <span className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold ${accent}`}>
        Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
