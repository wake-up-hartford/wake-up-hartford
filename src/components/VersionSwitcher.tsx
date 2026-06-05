import { Link, useRouterState } from "@tanstack/react-router";

export function VersionSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Only show on the homepage variants to keep things tidy.
  if (pathname !== "/" && pathname !== "/preview") return null;

  const base =
    "px-3 py-1 text-xs font-semibold rounded-full transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "text-foreground/70 hover:text-foreground";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-soft backdrop-blur">
      <span className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        Version
      </span>
      <Link to="/" className={`${base} ${pathname === "/" ? active : inactive}`}>
        v1
      </Link>
      <Link
        to="/preview"
        className={`${base} ${pathname === "/preview" ? active : inactive}`}
      >
        v2
      </Link>
    </div>
  );
}
