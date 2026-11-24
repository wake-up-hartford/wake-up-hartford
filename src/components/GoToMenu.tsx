import { Link, useLocation } from "@tanstack/react-router";
import { Building2, ChevronDown, HeartHandshake, Home, Trees, User } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const SECTIONS = [
  { to: "/dashboard", label: "Start", icon: Home },
  { to: "/life", label: "Your Life", icon: HeartHandshake },
  { to: "/home", label: "Your Home", icon: Building2 },
  { to: "/neighborhood", label: "Your Block", icon: Trees },
  { to: "/profile", label: "You", icon: User },
] as const;

// The site's main navigation: a button in the header that opens a list of the
// five sections. It replaced the bottom tab bar, which Netlify's free-plan
// badge covered. The button shows the current section's name, or "Menu".
export function GoToMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const current = SECTIONS.find((s) => s.to === pathname);

  // Close after moving to another page.
  useEffect(() => setOpen(false), [pathname]);

  // Close on a tap outside the menu, or on Escape (returning focus to the button).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="pop-btn inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2.5 font-display text-[14px] font-bold uppercase tracking-wide text-primary-foreground"
      >
        {current && <span className="sr-only">Menu, </span>}
        <span>{current?.label ?? "Menu"}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <nav
        id={panelId}
        aria-label="Main"
        hidden={!open}
        className="pop-card absolute right-0 z-50 mt-2 w-72 rounded-2xl bg-card p-2 text-card-foreground"
      >
        <ul>
          {SECTIONS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                  {active && <span className="ml-auto whitespace-nowrap text-[11px] font-medium opacity-80">You are here</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
