import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, FilePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listMyPlans } from "@/lib/stabilization-plan.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "My plans" }] }),
  component: PlansPage,
});

function PlansPage() {
  const nav = useNavigate();
  const { user, loading, signOut } = useAuth();
  const fetchPlans = useServerFn(listMyPlans);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-plans"],
    queryFn: () => fetchPlans({}),
    enabled: !!user,
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="font-display text-3xl text-foreground">Your plans</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">Plans you've generated from the Your Path Survey.</p>

      <Link
        to="/life"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft"
      >
        <FilePlus className="h-4 w-4" /> Start a new survey
      </Link>

      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data?.plans.length === 0 && (
          <p className="text-[14px] text-muted-foreground">No plans yet. Take the survey to create your first one.</p>
        )}
        {data?.plans.map((p) => (
          <Link
            key={p.id}
            to="/plan/$planId"
            params={{ planId: p.id }}
            className="flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors bg-[oklch(0.23_0.06_295)] hover:bg-[oklch(0.30_0.06_295)]"
          >
            <p className="font-display text-[16px] leading-tight text-foreground">
              Plan Created {new Date(p.generated_at).toLocaleDateString()}
            </p>
            {p.priority_domains.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.priority_domains.map((d) => (
                  <span key={d} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium capitalize text-accent">
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
        ))}
      </div>

      {user && (
        <button onClick={signOut} className="mt-8 w-full text-center text-[13px] text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      )}
    </AppShell>
  );
}
