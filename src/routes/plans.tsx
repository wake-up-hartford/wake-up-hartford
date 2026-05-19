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
      <p className="mt-2 text-[14px] text-muted-foreground">Plans you've generated from the Life Stabilization Survey.</p>

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
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft hover:bg-secondary/30"
          >
            <div className="flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                {new Date(p.generated_at).toLocaleDateString()}
              </p>
              <p className="mt-1 text-[14px] leading-snug text-card-foreground line-clamp-2">{p.summary}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
