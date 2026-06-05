import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, FilePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listMyPlans } from "@/lib/stabilization-plan.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "My Plans — Wake Up Wednesday" },
      { name: "description", content: "View and manage your 30-day stabilization plans." },
      { property: "og:title", content: "My Plans — Wake Up Wednesday" },
      { property: "og:description", content: "View and manage your 30-day stabilization plans." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/plans" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/plans" },
    ],
  }),
  component: PlansPage,
});

const DOMAIN_COLORS: Record<string, string> = {
  housing: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30",
  food: "bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30",
  health: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30",
  income: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
  debt: "bg-yellow-500/20 text-yellow-100 ring-1 ring-yellow-400/30",
  legal: "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30",
  safety: "bg-red-500/20 text-red-200 ring-1 ring-red-400/30",
  support: "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30",
};
const domainClass = (d: string) =>
  DOMAIN_COLORS[d.toLowerCase()] ?? "bg-accent/15 text-accent ring-1 ring-accent/20";

function PlansPage() {
  const nav = useNavigate();
  const { user, loading, signOut } = useAuth();
  const fetchPlans = useServerFn(listMyPlans);

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("wuw:postAuthRedirect", "/plans");
      }
      nav({ to: "/auth" });
    }
  }, [user, loading, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-plans"],
    queryFn: () => fetchPlans({}),
    enabled: !!user,
  });

  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="font-display text-3xl text-foreground">Your plans</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">Plans you've generated from the Your Life Survey.</p>

      <Link
        to="/life"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft"
      >
        <FilePlus className="h-4 w-4" /> Start a new survey
      </Link>

      <h2 className="mt-6 font-display text-xl text-foreground">Saved stabilization plans</h2>
      <div className="mt-3 space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data?.plans.length === 0 && (
          <p className="text-[14px] text-muted-foreground">No plans yet. Take the survey to create your first one.</p>
        )}
        {data?.plans.map((p) => {
          const pct = p.totalSteps > 0 ? Math.round((p.doneSteps / p.totalSteps) * 100) : 0;
          return (
            <Link
              key={p.id}
              to="/plan/$planId"
              params={{ planId: p.id }}
              className="flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors bg-[oklch(0.23_0.06_295)] hover:bg-[oklch(0.30_0.06_295)]"
            >
              <p className="font-display text-[16px] leading-tight text-foreground">
                Plan Created {new Date(p.generated_at).toLocaleDateString()}
              </p>
              {p.totalWeeks > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>
                      Week {p.currentWeek} of {p.totalWeeks} · {p.doneSteps} of {p.totalSteps} steps done
                    </span>
                    <span className="font-medium text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/40">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
              {p.priority_domains.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.priority_domains.map((d) => (
                    <span key={d} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${domainClass(d)}`}>
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[13px] leading-snug text-muted-foreground line-clamp-2">{p.summary}</p>
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <span>View plan</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {user && (
        <button onClick={signOut} className="mt-8 w-full text-center text-[13px] text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      )}
    </AppShell>
  );
}
