import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Circle, Phone, ExternalLink, Printer, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getPlan, toggleStep } from "@/lib/stabilization-plan.functions";
import { getResource } from "@/lib/ct-resources";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/plan/$planId")({
  head: () => ({ meta: [{ title: "Your 30-day plan" }] }),
  component: PlanPage,
});

type StepRow = {
  id: string;
  week: number;
  domain: string;
  title: string;
  detail: string | null;
  resource_id: string | null;
  step_order: number;
  completed_at: string | null;
};

type PlanShape = {
  priority_summary: string;
  crisis_flags: { note: string; hotline: string }[];
  weeks: { week: number; focus: string; steps: unknown[] }[];
};

function PlanPage() {
  const { planId } = Route.useParams();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const fetchPlan = useServerFn(getPlan);
  const qc = useQueryClient();
  const toggleFn = useServerFn(toggleStep);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlan({ data: { planId } }),
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: (vars: { stepId: string; done: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan", planId] }),
  });

  if (loading || isLoading) {
    return <AppShell><p className="text-muted-foreground">Loading your plan…</p></AppShell>;
  }
  if (error || !data) {
    return <AppShell><p className="text-destructive">{(error as Error)?.message ?? "Couldn't load plan."}</p></AppShell>;
  }

  const plan = data.plan.plan as PlanShape;
  const steps = data.steps as StepRow[];
  const stepsByWeek = new Map<number, StepRow[]>();
  for (const s of steps) {
    const arr = stepsByWeek.get(s.week) ?? [];
    arr.push(s);
    stepsByWeek.set(s.week, arr);
  }
  const total = steps.length;
  const done = steps.filter((s) => s.completed_at).length;

  return (
    <AppShell>
      <Link to="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      <div className="mb-5">
        <p className="mb-2 font-mono text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
          ▸ Your 30-day plan
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground">Your 30-Day Plan</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{plan.priority_summary}</p>
        <p className="mt-3 text-[12px] text-muted-foreground">
          {done} of {total} steps completed
        </p>
      </div>

      {plan.crisis_flags?.length > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-red-500/50 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Right now</span>
          </div>
          <ul className="space-y-2">
            {plan.crisis_flags.map((c, i) => (
              <li key={i} className="text-[14px] text-red-900">
                <p>{c.note}</p>
                <a href={`tel:${c.hotline.replace(/[^\d]/g, "")}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-red-700 underline">
                  <Phone className="h-3.5 w-3.5" /> {c.hotline}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {[1, 2, 3, 4].map((w) => {
          const weekMeta = plan.weeks.find((x) => x.week === w);
          const ws = stepsByWeek.get(w) ?? [];
          return (
            <div key={w} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-card-foreground">Week {w}</h2>
                {weekMeta && <span className="font-display text-[17px] leading-tight text-card-foreground">{weekMeta.focus}</span>}
              </div>
              <ul className="space-y-3">
                {ws.map((s) => {
                  const r = getResource(s.resource_id);
                  const isDone = !!s.completed_at;
                  return (
                    <li key={s.id} className="rounded-xl border border-border p-3">
                      <button
                        onClick={() => mut.mutate({ stepId: s.id, done: !isDone })}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        {isDone ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className={`text-[14px] font-semibold ${isDone ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                            {s.title}
                          </p>
                          {s.detail && (
                            <p className="mt-1 text-[13px] leading-relaxed text-card-foreground/90">{s.detail}</p>
                          )}
                          <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {s.domain}
                          </span>
                        </div>
                      </button>
                      {r && (
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-secondary/40 p-3">
                          <p className="text-[13px] font-semibold text-card-foreground">{r.name}</p>
                          <p className="text-[12px] text-muted-foreground">{r.eligibility_notes}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                            {r.phone && r.phone !== "n/a" && (
                              <a href={`tel:${r.phone.replace(/[^\d]/g, "")}`} className="inline-flex items-center gap-1 text-emerald-700">
                                <Phone className="h-3.5 w-3.5" /> {r.phone}
                              </a>
                            )}
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700">
                                <ExternalLink className="h-3.5 w-3.5" /> Website
                              </a>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{r.town} · {r.hours}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => window.print()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground hover:bg-secondary/50"
      >
        <Printer className="h-4 w-4" /> Print this plan
      </button>
    </AppShell>
  );
}
