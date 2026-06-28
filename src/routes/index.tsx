import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import wakeUpLogo from "@/assets/wake-up-hartford.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wake Up Wednesday — Know Your Home. Know Your Block." },
      {
        name: "description",
        content:
          "A community guide from the Greater Hartford Branch NAACP. Plain-language data about your home, your neighborhood, and your life.",
      },
      { property: "og:title", content: "Wake Up Wednesday — Know Your Home. Know Your Block." },
      {
        property: "og:description",
        content: "See the facts. Find the resources. Build the plan.",
      },
      { property: "og:url", content: "https://wake-up-hartford.lovable.app/" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford.lovable.app/" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const [activeCircle, setActiveCircle] = useState<string | null>(null);

  const toggle = (id: string) =>
    setActiveCircle((cur) => (cur === id ? null : id));

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="w-full px-4 pt-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-sm">
          Greater Hartford NAACP presents
        </p>
      </div>
      <img
        src={wakeUpLogo.url}
        alt="Wake Up Hartford"
        className="block w-full h-auto sm:max-w-md sm:mx-auto md:max-w-lg lg:max-w-xl"
      />
      <p className="mx-auto max-w-md px-6 pb-0 text-center text-sm font-medium text-foreground/80 sm:max-w-lg whitespace-pre-line sm:text-base">
        Learn the facts about your neighborhood and your home and&nbsp;get the tools to stabilize your life.{"\n"}
        {"\n"}
        <em>This site will guide you through ACTIONS to improve...</em>
      </p>

      {/* Triangle of pillar circles */}
      <section className="mx-auto flex max-w-md flex-col items-center px-6 pt-4 pb-8 sm:pt-6 sm:pb-12">
        <Circle
          id="life"
          label="Your Life"
          popup="Tell us what you're facing. Get a plan that's built for you."
          className="bg-accent text-accent-foreground opacity-90"
          popupClassName="bg-accent-popup text-accent-foreground"
          delay={300}
          active={activeCircle === "life"}
          onToggle={toggle}
          stackClass="z-10"
        />
        <div className="flex items-center justify-center gap-1 -mt-3 sm:-mt-4">
          <Circle
            id="home"
            label="Your Home"
            popup="Look up your address; Learn your rights."
            className="bg-primary text-primary-foreground opacity-90"
            popupClassName="bg-primary-popup text-primary-foreground"
            delay={1100}
            active={activeCircle === "home"}
            onToggle={toggle}
            stackClass="z-10"
          />
          <Circle
            id="neighborhood"
            label="Your Neighborhood"
            popup="Your block has a story. See the data behind it."
            className="bg-gold text-gold-foreground opacity-90"
            popupClassName="bg-gold-popup text-gold-foreground"
            delay={1900}
            active={activeCircle === "neighborhood"}
            onToggle={toggle}
            stackClass="z-10"
          />
        </div>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
        >
          Click to get started →
        </Link>
      </section>

      {/* Event strip */}
      <section className="border-y border-gold/30 bg-gold/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
                <a
                  href="https://www.google.com/maps/place/Unity+Plaza/data=!4m2!3m1!1s0x0:0xcee017a08e0cd643?sa=X&ved=1t:2428&ictx=111"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Unity Plaza · Barbour Street · Hartford
                </a>
                . Coffee, conversation, and your neighbors.
              </p>
            </div>
          </div>
        </div>
      </section>


      <footer className="border-t border-border/60 px-6 py-8 text-center text-[13px] text-foreground/70">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Developed by</p>
        <p className="mt-1 font-semibold text-foreground">
          Greater Hartford Branch NAACP
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          in collaboration with CT Data Collaborative and Farnam Associates, LLC.
        </p>
        <Link
          to="/about"
          className="mt-4 inline-block text-[13px] text-muted-foreground underline hover:text-foreground"
        >
          About This Tool
        </Link>
      </footer>
    </main>
  );
}


function Circle({
  id,
  label,
  popup,
  className,
  popupClassName,
  delay,
  active,
  onToggle,
  stackClass = "",
}: {
  id: string;
  label: string;
  popup: string;
  className: string;
  popupClassName: string;
  delay: number;
  active: boolean;
  onToggle: (id: string) => void;
  stackClass?: string;
}) {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => onToggle(id), 6000);
    return () => clearTimeout(t);
  }, [active, id, onToggle]);

  return (
    <div className={`relative ${stackClass} ${active ? "z-20" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={active}
        className={`circle-fly-in flex h-32 w-32 sm:h-40 sm:w-40 shrink-0 items-center justify-center rounded-full shadow-soft transition-transform duration-300 ease-out hover:scale-105 ${className}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className="font-display text-[13px] sm:text-base font-bold leading-[1.1] text-center px-2">
          {label}
        </span>
      </button>
      {active && (
        <div
          role="dialog"
          className={`popup-cover pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-full px-5 text-center text-sm sm:text-base font-medium leading-snug shadow-soft ${popupClassName}`}
        >
          {popup}
        </div>
      )}
    </div>
  );
}
