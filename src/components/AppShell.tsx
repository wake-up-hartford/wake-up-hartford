import { Link, useLocation } from "@tanstack/react-router";
import { Home, Building2, Trees, HeartHandshake, User } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import wuwLogo from "@/assets/wuw-logo.png";

const ROTATING_MESSAGES = [
  "Concentrated poverty is not natural. It is produced by policy choices.",
  "Poverty by ZIP code is a civil rights issue.",
  "Where a child lives should not determine their future.",
  "Awareness without investment is not justice.",
  "Data without action is not accountability.",
  "Our neighborhoods do not need pity. They need investment, and structural change.",
];

function RotatingMessages() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const interval = setInterval(() => {
      if (reduce) {
        setIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
        return;
      }
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
        setVisible(true);
      }, 250);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-t border-border/60">
      <div className="mx-auto w-full max-w-xl px-5 py-2.5 sm:px-6 sm:py-2">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-center text-[15px] sm:text-[14px] italic leading-snug text-gold transition-opacity duration-300"
          style={{
            fontFamily: '"Public Sans", sans-serif',
            fontWeight: 500,
            letterSpacing: "-0.01em",
            opacity: visible ? 1 : 0,
          }}
        >
          {ROTATING_MESSAGES[index]}
        </p>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/", label: "Start", icon: Home },
  { to: "/neighborhood", label: "Neighb.", icon: Trees },
  { to: "/home", label: "Home", icon: Building2 },
  { to: "/life", label: "Life", icon: HeartHandshake },
  { to: "/profile", label: "Account", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background bg-grain">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3 sm:px-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={wuwLogo} alt="Wake Up Wednesday" className={pathname === "/" ? "h-14 w-auto" : "h-10 w-auto"} />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground leading-tight hidden sm:block">
              Greater Hartford<br />Branch NAACP
            </span>
          </Link>
        </div>
        {pathname !== "/" && <RotatingMessages />}
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-6 sm:px-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <ul className="mx-auto grid w-full max-w-xl grid-cols-5 px-4 sm:px-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl leading-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-soft ${className}`}
      style={{
        // Re-scope global text tokens inside cards so child text stays readable
        // on the cream surface even in dark mode.
        ["--foreground" as string]: "var(--card-foreground)",
        ["--background" as string]: "var(--card)",
        ["--muted-foreground" as string]: "oklch(0.45 0.04 290)",
        ["--border" as string]: "oklch(0.85 0.02 80)",
      }}
    >
      {children}
    </div>
  );
}

export function SeverityPill({ severity, children }: { severity: "good" | "watch" | "concern"; children: ReactNode }) {
  const styles = {
    good: "bg-success/15 text-success border-success/25",
    watch: "bg-warning/20 text-warning-foreground border-warning/40",
    concern: "bg-destructive/12 text-destructive border-destructive/30",
  }[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
